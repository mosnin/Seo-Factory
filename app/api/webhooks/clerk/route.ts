import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";

// Clerk webhook event types
interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
  };
}

interface ClerkUserDeletedEvent {
  type: "user.deleted";
  data: {
    id: string;
    deleted: boolean;
  };
}

type ClerkWebhookEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent;

/**
 * POST /api/webhooks/clerk
 *
 * Handles Clerk webhook events:
 * - user.created: Creates user in database and sends welcome email
 * - user.deleted: Deletes user from database
 *
 * Requires CLERK_WEBHOOK_SECRET environment variable.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  // Get the Svix headers for verification
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const body = await request.text();

  // Verify the webhook signature
  const wh = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[Clerk Webhook] Verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "user.created": {
        const { id: clerkId, email_addresses, first_name, last_name } = event.data;
        const email = email_addresses[0]?.email_address;

        if (!email) {
          console.error("[Clerk Webhook] User created without email:", clerkId);
          return NextResponse.json({ received: true });
        }

        const name = first_name
          ? `${first_name} ${last_name ?? ""}`.trim()
          : null;

        // Create user in database
        const user = await prisma.user.upsert({
          where: { clerkId },
          update: { email, name },
          create: {
            clerkId,
            email,
            name,
            creditsBalance: 10, // Free credits for new users
          },
        });

        // Queue welcome email
        await queueEmail({
          template: "welcome",
          userId: user.id,
          to: user.email,
          referenceId: "signup",
          data: { name: user.name },
        }).catch((err) =>
          console.error("[Clerk Webhook] Failed to queue welcome email:", err)
        );

        console.log("[Clerk Webhook] User created:", user.email);
        break;
      }

      case "user.deleted": {
        const { id: clerkId } = event.data;

        // Delete user from database (cascades to related records)
        await prisma.user.delete({
          where: { clerkId },
        }).catch(() => {
          // User might not exist in our database
          console.log("[Clerk Webhook] User not found for deletion:", clerkId);
        });

        console.log("[Clerk Webhook] User deleted:", clerkId);
        break;
      }

      default:
        console.log("[Clerk Webhook] Unhandled event type:", (event as { type: string }).type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Clerk Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
