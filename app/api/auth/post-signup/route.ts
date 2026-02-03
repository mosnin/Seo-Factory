import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueEmail } from "@/lib/email";

/**
 * POST /api/auth/post-signup
 *
 * Called after Cognito post-confirmation Lambda creates the user record.
 * Queues a welcome email for the newly registered user.
 *
 * Body: { email: string }
 * Protected by INTERNAL_WEBHOOK_SECRET in production.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await queueEmail({
      template: "welcome",
      userId: user.id,
      to: user.email,
      referenceId: "signup",
      data: { name: user.name },
    });

    return NextResponse.json({ queued: true });
  } catch (error) {
    console.error("[POST /api/auth/post-signup]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
