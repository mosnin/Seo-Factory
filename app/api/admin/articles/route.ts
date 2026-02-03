import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { PLAN_CREDITS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const quality = searchParams.get("quality") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const where: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (userId) {
    where.userId = userId;
  }

  if (quality === "low") {
    where.eeatScore = { lt: 5 };
  } else if (quality === "high") {
    where.eeatScore = { gte: 7 };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  const formatted = articles.map((a) => ({
    id: a.id,
    keyword: a.keyword,
    title: a.title,
    status: a.status,
    seoScore: a.seoScore,
    eeatScore: a.eeatScore,
    readabilityScore: a.readabilityScore,
    wordCount: a.wordCount,
    userEmail: a.user.email,
    userName: a.user.name,
    userId: a.userId,
    createdAt: a.createdAt,
  }));

  return NextResponse.json({ articles: formatted, total, page, limit });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action as string;

  if (action === "regenerate") {
    const articleId = body.articleId as string;
    if (!articleId) {
      return NextResponse.json(
        { error: "articleId required" },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Create a new article with the same params and refund the user
    const [newArticle] = await prisma.$transaction([
      prisma.article.create({
        data: {
          userId: article.userId,
          keyword: article.keyword,
          targetLength: article.targetLength,
          brandVoiceId: article.brandVoiceId,
          status: "QUEUED",
        },
      }),
      prisma.user.update({
        where: { id: article.userId },
        data: { creditsBalance: { increment: 1 } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: article.userId,
          amount: 1,
          type: "REFUND",
          description: `Admin regenerated article "${article.keyword}" — credit refunded`,
          referenceId: articleId,
        },
      }),
    ]);

    return NextResponse.json({ success: true, newArticleId: newArticle.id });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
