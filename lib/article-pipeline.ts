import { Worker, Job } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";
import { getSerpData } from "./serp";
import { generateOutline } from "./claude";
import { ARTICLE_QUEUE_NAME, type ArticleJobData } from "./queue";
import { ARTICLE_CREDIT_COST } from "./constants";

async function processArticleJob(job: Job<ArticleJobData>): Promise<void> {
  const { articleId, userId, keyword, brandVoiceId, targetLength } = job.data;

  try {
    // ── Stage 1: SERP Research ──────────────────────────────────────────
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "RESEARCHING" },
    });

    const serpData = await getSerpData(keyword);

    await prisma.article.update({
      where: { id: articleId },
      data: {
        serpDataJson: JSON.parse(JSON.stringify(serpData)),
        status: "OUTLINING",
      },
    });

    // ── Stage 2: Outline Generation ─────────────────────────────────────
    let brandVoiceGuidelines: string | undefined;
    if (brandVoiceId) {
      const voice = await prisma.brandVoice.findUnique({
        where: { id: brandVoiceId },
      });
      if (voice) {
        brandVoiceGuidelines = [
          `Tone: ${voice.tone}`,
          `Point of view: ${voice.pointOfView}`,
          voice.guidelines ? `Guidelines: ${voice.guidelines}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    const outline = await generateOutline(
      keyword,
      serpData,
      brandVoiceGuidelines
    );

    await prisma.article.update({
      where: { id: articleId },
      data: {
        outlineJson: JSON.parse(JSON.stringify(outline)),
        targetLength,
        status: "WRITING",
      },
    });
  } catch (error) {
    const attempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 3;

    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
        retryCount: attempt,
      },
    });

    // Refund credits on final failure
    if (attempt >= maxAttempts) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { creditsBalance: { increment: ARTICLE_CREDIT_COST } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: ARTICLE_CREDIT_COST,
            type: "REFUND",
            referenceId: articleId,
            description: `Refund for failed article: ${keyword}`,
          },
        }),
      ]);
    }

    throw error; // Re-throw so BullMQ handles retries
  }
}

export function startArticleWorker(): Worker<ArticleJobData> {
  const worker = new Worker<ArticleJobData>(
    ARTICLE_QUEUE_NAME,
    processArticleJob,
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[article-worker] Job ${job.id} completed: ${job.data.keyword}`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[article-worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`
    );
  });

  return worker;
}
