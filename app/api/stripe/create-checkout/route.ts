import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { STRIPE_PRICE_IDS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils";

const checkoutSchema = z.object({
  price_key: z.enum(["STARTER", "PRO", "CREDIT_50", "CREDIT_100"]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst({
      include: { subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid price key", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { price_key } = parsed.data;
    const priceId = STRIPE_PRICE_IDS[price_key];
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured" },
        { status: 400 }
      );
    }

    const isSubscription = price_key === "STARTER" || price_key === "PRO";

    // Get or create Stripe customer
    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: absoluteUrl("/dashboard/billing?success=true"),
      cancel_url: absoluteUrl("/dashboard/billing"),
      metadata: {
        userId: user.id,
        priceKey: price_key,
      },
      ...(isSubscription && {
        subscription_data: {
          metadata: { userId: user.id },
        },
      }),
      ...(! isSubscription && {
        payment_intent_data: {
          metadata: { userId: user.id, priceKey: price_key },
        },
      }),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[POST /api/stripe/create-checkout]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
