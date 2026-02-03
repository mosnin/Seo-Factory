import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/monthly-summary
 *
 * Triggered by an external cron scheduler (e.g., AWS EventBridge, Vercel Cron)
 * on the 1st of each month. Sends a monthly activity summary to all users
 * who generated at least one article in the previous month.
 *
 * Protected by CRON_SECRET in production.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const monthName = firstOfLastMonth.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Find users who had activity last month
    const users = await prisma.user.findMany({
      where: {
        articles: {
          some: {
            createdAt: {
              gte: firstOfLastMonth,
              lt: firstOfThisMonth,
            },
          },
        },
      },
      include: {
        articles: {
          where: {
            createdAt: {
              gte: firstOfLastMonth,
              lt: firstOfThisMonth,
            },
          },
          select: { keyword: true },
        },
        creditTransactions: {
          where: {
            type: "USAGE",
            createdAt: {
              gte: firstOfLastMonth,
              lt: firstOfThisMonth,
            },
          },
          select: { amount: true },
        },
      },
    });

    let queued = 0;

    for (const user of users) {
      const articlesGenerated = user.articles.length;
      const creditsUsed = user.creditTransactions.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      );

      // Count keywords by frequency and take top 5
      const keywordCounts: Record<string, number> = {};
      for (const a of user.articles) {
        keywordCounts[a.keyword] = (keywordCounts[a.keyword] ?? 0) + 1;
      }
      const topKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([kw]) => kw);

      const referenceId = `monthly-${firstOfLastMonth.toISOString().slice(0, 7)}`;

      await queueEmail({
        template: "monthly-summary",
        userId: user.id,
        to: user.email,
        referenceId,
        data: {
          name: user.name,
          articlesGenerated,
          creditsUsed,
          topKeywords,
          month: monthName,
        },
      });

      queued++;
    }

    return NextResponse.json({ queued, month: monthName });
  } catch (error) {
    console.error("[POST /api/cron/monthly-summary]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
