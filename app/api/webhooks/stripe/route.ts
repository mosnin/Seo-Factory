import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  PLAN_CREDITS,
  PRICE_TO_PLAN,
  PRICE_TO_CREDITS,
} from "@/lib/constants";
import { queueEmail } from "@/lib/email";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function addCredits(
  userId: string,
  amount: number,
  type: "PURCHASE" | "BONUS",
  description: string,
  referenceId?: string
) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditsBalance: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        referenceId,
      },
    }),
  ]);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const priceKey = session.metadata?.priceKey;

  // One-time credit purchase
  if (session.mode === "payment" && priceKey) {
    const credits = PRICE_TO_CREDITS[priceKey] ?? PRICE_TO_CREDITS[`price_credit_${priceKey.replace("CREDIT_", "")}`];
    if (credits) {
      await addCredits(
        userId,
        credits,
        "PURCHASE",
        `Purchased ${credits} credits`,
        session.id
      );
    }
  }
  // Subscription handled by customer.subscription.created
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return;

  const planKey = PRICE_TO_PLAN[priceId];
  const planTier = planKey as "STARTER" | "PRO" | undefined;
  if (!planTier) return;

  const credits = PLAN_CREDITS[planTier] ?? 0;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Upsert subscription record
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ),
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: false,
    },
  });

  // Update user plan tier and add credits
  await prisma.user.update({
    where: { id: userId },
    data: { planTier },
  });

  await addCredits(
    userId,
    credits,
    "PURCHASE",
    `${planTier} plan subscription activated — ${credits} credits`,
    subscription.id
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) return;

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return;

  const planKey = PRICE_TO_PLAN[priceId];
  const planTier = planKey as "STARTER" | "PRO" | undefined;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  if (planTier) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: { planTier },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!sub) return;

  // Downgrade to free
  await prisma.user.update({
    where: { id: sub.userId },
    data: { planTier: "FREE" },
  });

  await prisma.subscription.delete({
    where: { stripeSubscriptionId: subscription.id },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Only handle recurring payments (not the first one which is handled by subscription.created)
  if (
    invoice.billing_reason !== "subscription_cycle" &&
    invoice.billing_reason !== "subscription_update"
  ) {
    return;
  }

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
  if (!subscriptionId) return;

  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) return;

  const planKey = PRICE_TO_PLAN[sub.stripePriceId];
  if (!planKey) return;

  const credits = PLAN_CREDITS[planKey] ?? 0;
  if (credits <= 0) return;

  await addCredits(
    sub.userId,
    credits,
    "PURCHASE",
    `Monthly ${planKey} plan renewal — ${credits} credits`,
    invoice.id
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  console.error(
    `[Stripe] Payment failed for customer ${customerId}, invoice ${invoice.id}`
  );

  if (!customerId) return;

  const sub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (sub) {
    await queueEmail({
      template: "payment-failed",
      userId: sub.user.id,
      to: sub.user.email,
      referenceId: invoice.id,
      data: { invoiceId: invoice.id },
    }).catch((err) =>
      console.error(
        "[Stripe Webhook] Failed to queue payment-failed email:",
        err
      )
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (error) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
