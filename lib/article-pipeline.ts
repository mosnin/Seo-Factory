import { Worker, Job } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";
import { getSerpData } from "./serp";
import { generateOutline } from "./claude";
import { factCheckArticle } from "./fact-checker";
import { optimizeArticle } from "./optimizer";
import { ARTICLE_QUEUE_NAME, type ArticleJobData } from "./queue";
import { ARTICLE_CREDIT_COST } from "./constants";
import { queueEmail } from "./email";

async function processArticleJob(job: Job<ArticleJobData>): Promise<void> {
  const { articleId, userId, keyword, brandVoiceId, targetLength } = job.data;
  const jobStartTime = new Date();

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

    // ── Stage 3: (Draft writing would happen here — placeholder) ────────
    // The WRITING stage is handled externally or by a future stage.
    // Once content is written and contains [^citation_needed] markers,
    // the fact-checking stage processes them.

    // ── Stage 4: Fact-Checking ────────────────────────────────────────────
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "FACT_CHECKING" },
    });

    const factCheckResult = await factCheckArticle(articleId);

    console.log(
      `[article-worker] Fact-check complete for ${keyword}: ` +
        `${factCheckResult.citations.length} verified, ` +
        `${factCheckResult.unresolvedCount} need review`
    );

    // factCheckArticle already sets status to OPTIMIZING

    // ── Stage 5: Optimization ─────────────────────────────────────────────
    const optimizationResult = await optimizeArticle(articleId, jobStartTime);

    console.log(
      `[article-worker] Optimization complete for ${keyword}: ` +
        `SEO=${optimizationResult.seoScore}, ` +
        `readability=${optimizationResult.readabilityScore}, ` +
        `E-E-A-T=${optimizationResult.eeatScore}, ` +
        `${optimizationResult.generationTimeSec}s total`
    );

    // optimizeArticle sets status to READY

    // ── Send "article ready" email ──────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, creditsBalance: true },
    });
    if (user) {
      await queueEmail({
        template: "article-ready",
        userId,
        to: user.email,
        referenceId: articleId,
        data: {
          keyword,
          articleId,
          seoScore: optimizationResult.seoScore,
          wordCount: optimizationResult.wordCount ?? null,
        },
      }).catch((err) =>
        console.error("[article-worker] Failed to queue article-ready email:", err)
      );

      // Check for low credits and send warning if below threshold
      if (user.creditsBalance < 10) {
        await queueEmail({
          template: "low-credits",
          userId,
          to: user.email,
          referenceId: `low-credits-${user.creditsBalance}`,
          data: { currentBalance: user.creditsBalance },
        }).catch((err) =>
          console.error("[article-worker] Failed to queue low-credits email:", err)
        );
      }
    }
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
