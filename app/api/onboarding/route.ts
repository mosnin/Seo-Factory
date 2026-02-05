import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const completeOnboardingSchema = z.object({
  // Brand voice data
  tone: z.string().optional(),
  point_of_view: z.string().optional(),
  exemplar_content: z.string().optional(),
  // Content focus data
  industry: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

/**
 * POST /api/onboarding
 * Completes the onboarding flow and creates a default brand voice if provided.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = completeOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tone, point_of_view, exemplar_content, industry, keywords } =
      parsed.data;

    // Create a default brand voice if tone and pov are provided
    let brandVoiceId: string | null = null;
    if (tone && point_of_view) {
      // Unset any existing default
      await prisma.brandVoice.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });

      const brandVoice = await prisma.brandVoice.create({
        data: {
          userId: user.id,
          name: "My Brand Voice",
          tone,
          pointOfView: point_of_view,
          exemplarContent: exemplar_content,
          isDefault: true,
        },
      });
      brandVoiceId = brandVoice.id;
    }

    // Store content focus preferences (optional metadata)
    // For now, we just log them; in production, store in user preferences table
    if (industry || keywords?.length) {
      console.log("[onboarding] Content focus:", { industry, keywords });
    }

    // Mark onboarding as complete
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({
      success: true,
      brand_voice_id: brandVoiceId,
    });
  } catch (error) {
    console.error("[POST /api/onboarding]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onboarding
 * Returns the current onboarding status.
 */
export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user_id: user.id,
      name: user.name,
      onboarding_completed: user.onboardingCompleted,
      credits_balance: user.creditsBalance,
    });
  } catch (error) {
    console.error("[GET /api/onboarding]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
