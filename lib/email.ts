import { Resend } from "resend";
import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/emails/welcome";
import { ArticleReadyEmail } from "@/emails/article-ready";
import { LowCreditsEmail } from "@/emails/low-credits";
import { PaymentFailedEmail } from "@/emails/payment-failed";
import { MonthlySummaryEmail } from "@/emails/monthly-summary";

// ── Resend Client ────────────────────────────────────────────────────────────

// Lazy initialization to avoid build-time errors when API key isn't available
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@seofactory.dev";
const APP_NAME = "SEO Factory";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Email Job Types ───────────────────────────────────────────────────────────

export type EmailTemplate =
  | "welcome"
  | "article-ready"
  | "low-credits"
  | "payment-failed"
  | "monthly-summary";

interface BaseEmailJob {
  userId: string;
  to: string;
  referenceId?: string;
}

interface WelcomeJob extends BaseEmailJob {
  template: "welcome";
  data: { name: string | null };
}

interface ArticleReadyJob extends BaseEmailJob {
  template: "article-ready";
  data: {
    keyword: string;
    articleId: string;
    seoScore: number | null;
    wordCount: number | null;
  };
}

interface LowCreditsJob extends BaseEmailJob {
  template: "low-credits";
  data: { currentBalance: number };
}

interface PaymentFailedJob extends BaseEmailJob {
  template: "payment-failed";
  data: { invoiceId: string };
}

interface MonthlySummaryJob extends BaseEmailJob {
  template: "monthly-summary";
  data: {
    name: string | null;
    articlesGenerated: number;
    creditsUsed: number;
    topKeywords: string[];
    month: string;
  };
}

export type EmailJobData =
  | WelcomeJob
  | ArticleReadyJob
  | LowCreditsJob
  | PaymentFailedJob
  | MonthlySummaryJob;

// ── Email Queue ───────────────────────────────────────────────────────────────

export const EMAIL_QUEUE_NAME = "email-notifications";

// Lazy initialization to avoid build-time connection attempts
let emailQueueInstance: Queue<EmailJobData> | null = null;

function getEmailQueue(): Queue<EmailJobData> {
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 10_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return emailQueueInstance;
}

// Export for backwards compatibility
export const emailQueue = {
  add: async (...args: Parameters<Queue<EmailJobData>["add"]>) => {
    return getEmailQueue().add(...args);
  },
};

// ── Template Rendering ────────────────────────────────────────────────────────

async function renderTemplate(
  job: EmailJobData
): Promise<{ subject: string; html: string }> {
  switch (job.template) {
    case "welcome": {
      const subject = `Welcome to ${APP_NAME} — Your 10 free credits are ready`;
      const html = await render(
        WelcomeEmail({
          name: job.data.name,
          appUrl: APP_URL,
          appName: APP_NAME,
        })
      );
      return { subject, html };
    }

    case "article-ready": {
      const subject = `Your article "${job.data.keyword}" is ready`;
      const html = await render(
        ArticleReadyEmail({
          keyword: job.data.keyword,
          articleUrl: `${APP_URL}/dashboard/articles/${job.data.articleId}/edit`,
          seoScore: job.data.seoScore,
          wordCount: job.data.wordCount,
          appName: APP_NAME,
        })
      );
      return { subject, html };
    }

    case "low-credits": {
      const subject = "You're running low on credits";
      const html = await render(
        LowCreditsEmail({
          currentBalance: job.data.currentBalance,
          billingUrl: `${APP_URL}/dashboard/billing`,
          appName: APP_NAME,
        })
      );
      return { subject, html };
    }

    case "payment-failed": {
      const subject = "Action required: Payment failed";
      const html = await render(
        PaymentFailedEmail({
          billingUrl: `${APP_URL}/dashboard/billing`,
          appName: APP_NAME,
        })
      );
      return { subject, html };
    }

    case "monthly-summary": {
      const subject = `Your ${APP_NAME} monthly report`;
      const html = await render(
        MonthlySummaryEmail({
          name: job.data.name,
          articlesGenerated: job.data.articlesGenerated,
          creditsUsed: job.data.creditsUsed,
          topKeywords: job.data.topKeywords,
          month: job.data.month,
          dashboardUrl: `${APP_URL}/dashboard`,
          appName: APP_NAME,
        })
      );
      return { subject, html };
    }
  }
}

// ── Send via Resend ──────────────────────────────────────────────────────────

async function sendViaResend(to: string, subject: string, html: string) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// ── Job Processor ─────────────────────────────────────────────────────────────

async function processEmailJob(job: Job<EmailJobData>) {
  const { template, userId, to, referenceId } = job.data;

  // Deduplicate: skip if already sent for this user + template + reference
  const existing = await prisma.emailLog.findUnique({
    where: {
      userId_template_referenceId: {
        userId,
        template,
        referenceId: referenceId ?? "",
      },
    },
  });

  if (existing) {
    console.log(`[email-worker] Skipping duplicate: ${template} for ${to}`);
    return;
  }

  const { subject, html } = await renderTemplate(job.data);

  await sendViaResend(to, subject, html);

  // Log the sent email
  await prisma.emailLog.create({
    data: {
      userId,
      template,
      subject,
      referenceId: referenceId ?? "",
    },
  });

  console.log(`[email-worker] Sent ${template} to ${to}`);
}

// ── Worker ────────────────────────────────────────────────────────────────────

export function startEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    processEmailJob,
    {
      connection: redis,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(
      `[email-worker] Job ${job.id} completed: ${job.data.template}`
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`[email-worker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

// ── Convenience: Queue an Email ───────────────────────────────────────────────

export async function queueEmail(data: EmailJobData) {
  await emailQueue.add(
    `email-${data.template}-${data.userId}-${Date.now()}`,
    data
  );
}
