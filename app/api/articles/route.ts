import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { articleQueue, type ArticleJobData } from "@/lib/queue";
import { ARTICLE_CREDIT_COST } from "@/lib/constants";

const createArticleSchema = z.object({
  keyword: z
    .string()
    .min(1, "Keyword is required")
    .max(200, "Keyword must be 200 characters or less"),
  brand_voice_id: z.string().optional(),
  length: z.number().int().min(500).max(10000).default(1500),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { keyword, brand_voice_id, length } = parsed.data;

    // For now, use the first user (in production, extract from auth token)
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Validate credits
    if (user.creditsBalance < ARTICLE_CREDIT_COST) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: ARTICLE_CREDIT_COST,
          available: user.creditsBalance,
        },
        { status: 402 }
      );
    }

    // Validate brand voice if provided
    if (brand_voice_id) {
      const voice = await prisma.brandVoice.findUnique({
        where: { id: brand_voice_id, userId: user.id },
      });
      if (!voice) {
        return NextResponse.json(
          { error: "Brand voice not found" },
          { status: 404 }
        );
      }
    }

    // Deduct credits and create article in a transaction
    const [article] = await prisma.$transaction([
      prisma.article.create({
        data: {
          userId: user.id,
          keyword,
          targetLength: length,
          brandVoiceId: brand_voice_id,
          status: "QUEUED",
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { creditsBalance: { decrement: ARTICLE_CREDIT_COST } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -ARTICLE_CREDIT_COST,
          type: "USAGE",
          description: `Article generation: ${keyword}`,
        },
      }),
    ]);

    // Enqueue background job
    const jobData: ArticleJobData = {
      articleId: article.id,
      userId: user.id,
      keyword,
      brandVoiceId: brand_voice_id,
      targetLength: length,
    };

    await articleQueue.add(`article-${article.id}`, jobData);

    return NextResponse.json(
      {
        article_id: article.id,
        status: article.status,
        keyword: article.keyword,
        credits_deducted: ARTICLE_CREDIT_COST,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/articles]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
