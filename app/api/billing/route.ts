import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      include: {
        subscription: true,
        creditTransactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Compute running balance for transactions
    let runningBalance = user.creditsBalance;
    const transactions = user.creditTransactions.map((tx) => {
      const balanceAfter = runningBalance;
      runningBalance -= tx.amount; // walk backward
      return {
        id: tx.id,
        date: tx.createdAt,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        balance_after: balanceAfter,
      };
    });

    return NextResponse.json({
      plan_tier: user.planTier,
      credits_balance: user.creditsBalance,
      subscription: user.subscription
        ? {
            stripe_subscription_id: user.subscription.stripeSubscriptionId,
            stripe_price_id: user.subscription.stripePriceId,
            current_period_end: user.subscription.stripeCurrentPeriodEnd,
            cancel_at_period_end: user.subscription.cancelAtPeriodEnd,
          }
        : null,
      transactions,
    });
  } catch (error) {
    console.error("[GET /api/billing]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
