import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // For now, use first user. In production, extract from auth token.
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Credits remaining
    const creditsBalance = user.creditsBalance;

    // Articles this month
    const articlesThisMonth = await prisma.article.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
      },
    });

    // Avg E-E-A-T score this month
    const eeatAgg = await prisma.article.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
        eeatScore: { not: null },
      },
      _avg: { eeatScore: true },
    });

    // Total completed articles (for time saved)
    const completedArticles = await prisma.article.count({
      where: {
        userId: user.id,
        status: { in: ["READY", "REVIEWING", "PUBLISHED"] },
      },
    });

    // Sparkline: articles per day for last 30 days
    const articlesLast30 = await prisma.article.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Bucket into daily counts
    const dailyCounts: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = articlesLast30.filter(
        (a) => a.createdAt >= dayStart && a.createdAt < dayEnd
      ).length;
      dailyCounts.push(count);
    }

    return NextResponse.json({
      credits_balance: creditsBalance,
      articles_this_month: articlesThisMonth,
      avg_quality_score: eeatAgg._avg.eeatScore
        ? Math.round(eeatAgg._avg.eeatScore * 10) / 10
        : null,
      completed_articles: completedArticles,
      time_saved_hours: completedArticles * 2,
      sparkline_data: dailyCounts,
    });
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
