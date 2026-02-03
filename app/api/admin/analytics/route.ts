import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [
    totalUsers,
    activeUsers,
    subscriptions,
    canceledRecently,
    planDistribution,
    creditTransactions,
    topKeywords,
    revenueData,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Active users (generated article in last 30 days)
    prisma.user.count({
      where: {
        articles: {
          some: { createdAt: { gte: thirtyDaysAgo } },
        },
      },
    }),

    // Active subscriptions for MRR
    prisma.subscription.findMany({
      where: { cancelAtPeriodEnd: false },
      include: { user: { select: { planTier: true } } },
    }),

    // Canceled subscriptions in last 30 days
    prisma.subscription.count({
      where: { cancelAtPeriodEnd: true },
    }),

    // Plan distribution
    prisma.user.groupBy({
      by: ["planTier"],
      _count: { id: true },
    }),

    // Credit usage by type and plan tier (last 90 days)
    prisma.creditTransaction.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        type: "USAGE",
      },
      include: { user: { select: { planTier: true } } },
    }),

    // Top keywords (last 90 days)
    prisma.article.groupBy({
      by: ["keyword"],
      _count: { id: true },
      where: { createdAt: { gte: ninetyDaysAgo } },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),

    // Purchase transactions for revenue chart (last 90 days)
    prisma.creditTransaction.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        type: "PURCHASE",
      },
      select: { amount: true, createdAt: true, description: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Calculate MRR from active subscriptions
  const PLAN_PRICES: Record<string, number> = {
    STARTER: 99,
    PRO: 249,
    ENTERPRISE: 999,
  };
  const mrr = subscriptions.reduce((sum, sub) => {
    const price = PLAN_PRICES[sub.user.planTier] ?? 0;
    return sum + price;
  }, 0);

  const totalSubs = subscriptions.length + canceledRecently;
  const churnRate =
    totalSubs > 0 ? ((canceledRecently / totalSubs) * 100).toFixed(1) : "0.0";

  // Format plan distribution
  const planDist = planDistribution.map((p) => ({
    name: p.planTier,
    value: p._count.id,
  }));

  // Format credit usage by tier
  const creditsByTier: Record<string, number> = {};
  for (const tx of creditTransactions) {
    const tier = tx.user.planTier;
    creditsByTier[tier] = (creditsByTier[tier] ?? 0) + Math.abs(tx.amount);
  }
  const creditUsage = Object.entries(creditsByTier).map(([tier, total]) => ({
    tier,
    credits: total,
  }));

  // Format revenue over time (aggregate by day)
  const revenueByDay: Record<string, number> = {};
  for (const tx of revenueData) {
    const day = tx.createdAt.toISOString().slice(0, 10);
    // Estimate dollar value: subscription purchases have descriptive text
    // For simplicity, count each purchase transaction amount
    revenueByDay[day] = (revenueByDay[day] ?? 0) + tx.amount;
  }
  const revenueTimeline = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, credits]) => ({ date, credits }));

  // Format top keywords
  const keywords = topKeywords.map((k) => ({
    keyword: k.keyword,
    count: k._count.id,
  }));

  return NextResponse.json({
    metrics: {
      totalUsers,
      activeUsers,
      mrr,
      churnRate: parseFloat(churnRate),
    },
    planDistribution: planDist,
    creditUsage,
    revenueTimeline,
    topKeywords: keywords,
  });
}
