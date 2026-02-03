import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";
import { render } from "@react-email/components";
import { WelcomeEmail } from "@/emails/welcome";
import { ArticleReadyEmail } from "@/emails/article-ready";
import { LowCreditsEmail } from "@/emails/low-credits";
import { PaymentFailedEmail } from "@/emails/payment-failed";
import { MonthlySummaryEmail } from "@/emails/monthly-summary";

// ── SES Client ────────────────────────────────────────────────────────────────

const ses = new SESClient({
  region:
    process.env.AWS_SES_REGION ??
    process.env.NEXT_PUBLIC_COGNITO_REGION ??
    "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "noreply@seofactory.dev";
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

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

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

// ── Send via SES ──────────────────────────────────────────────────────────────

async function sendViaSes(to: string, subject: string, html: string) {
  const command = new SendEmailCommand({
    Source: `${APP_NAME} <${FROM_EMAIL}>`,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
      },
    },
  });

  await ses.send(command);
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

  await sendViaSes(to, subject, html);

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
