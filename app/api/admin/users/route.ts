import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const where: Record<string, unknown> = {};

  if (search) {
    where.email = { contains: search, mode: "insensitive" };
  }

  if (plan && plan !== "ALL") {
    where.planTier = plan;
  }

  // "active" = generated article in last 30 days; "churned" = has canceled subscription
  if (status === "active") {
    where.articles = {
      some: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    };
  } else if (status === "churned") {
    where.subscription = null;
    where.planTier = { not: "FREE" };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        subscription: true,
        _count: { select: { articles: true, creditTransactions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const formatted = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    planTier: u.planTier,
    creditsBalance: u.creditsBalance,
    articlesCount: u._count.articles,
    hasSubscription: !!u.subscription,
    cancelAtPeriodEnd: u.subscription?.cancelAtPeriodEnd ?? false,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ users: formatted, total, page, limit });
}

const addCreditsSchema = z.object({
  userId: z.string(),
  amount: z.number().int().positive(),
  description: z.string().optional(),
});

const changePlanSchema = z.object({
  userId: z.string(),
  planTier: z.enum(["FREE", "STARTER", "PRO", "ENTERPRISE"]),
});

const suspendSchema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const action = body.action as string;

  switch (action) {
    case "add_credits": {
      const parsed = addCreditsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const { userId, amount, description } = parsed.data;
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { creditsBalance: { increment: amount } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount,
            type: "BONUS",
            description: description ?? `Admin granted ${amount} credits`,
          },
        }),
      ]);
      return NextResponse.json({ success: true });
    }

    case "change_plan": {
      const parsed = changePlanSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const { userId, planTier } = parsed.data;
      await prisma.user.update({
        where: { id: userId },
        data: { planTier },
      });
      return NextResponse.json({ success: true });
    }

    case "suspend": {
      const parsed = suspendSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const { userId } = parsed.data;
      // Downgrade to FREE and remove subscription
      await prisma.user.update({
        where: { id: userId },
        data: { planTier: "FREE", creditsBalance: 0 },
      });
      await prisma.subscription
        .delete({ where: { userId } })
        .catch(() => {});
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
