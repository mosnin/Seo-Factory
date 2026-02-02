import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // For now, use the first user (in production, extract from auth token)
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const brandVoices = await prisma.brandVoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tone: true,
        pointOfView: true,
      },
    });

    return NextResponse.json({ brand_voices: brandVoices });
  } catch (error) {
    console.error("[GET /api/brand-voices]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
