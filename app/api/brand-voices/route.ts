import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/* ---------- GET: list brand voices ---------- */

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const brandVoices = await prisma.brandVoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { articles: true } } },
    });

    return NextResponse.json({
      brand_voices: brandVoices.map((v) => ({
        id: v.id,
        name: v.name,
        tone: v.tone,
        point_of_view: v.pointOfView,
        exemplar_content: v.exemplarContent,
        guidelines: v.guidelines,
        forbidden_phrases: v.forbiddenPhrases,
        is_default: v.isDefault,
        embedding_id: v.embeddingId,
        articles_count: v._count.articles,
        created_at: v.createdAt,
        updated_at: v.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[GET /api/brand-voices]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- POST: create brand voice ---------- */

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  tone: z.string().min(1, "Tone is required"),
  point_of_view: z.string().min(1, "Point of view is required"),
  guidelines: z.string().max(2000).optional(),
  exemplar_content: z.string().max(5000).optional(),
  forbidden_phrases: z.string().max(1000).optional(),
  is_default: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      tone,
      point_of_view,
      guidelines,
      exemplar_content,
      forbidden_phrases,
      is_default,
    } = parsed.data;

    // If setting as default, unset previous default
    if (is_default) {
      await prisma.brandVoice.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Embedding generation stub — would call OpenAI embeddings API here
    let embeddingId: string | null = null;
    if (exemplar_content && exemplar_content.trim().length > 0) {
      // TODO: Generate embedding via OpenAI API and store
      embeddingId = null;
    }

    const voice = await prisma.brandVoice.create({
      data: {
        userId: user.id,
        name,
        tone,
        pointOfView: point_of_view,
        guidelines: guidelines ?? null,
        exemplarContent: exemplar_content ?? null,
        forbiddenPhrases: forbidden_phrases ?? null,
        isDefault: is_default ?? false,
        embeddingId,
      },
    });

    return NextResponse.json(
      {
        id: voice.id,
        name: voice.name,
        tone: voice.tone,
        point_of_view: voice.pointOfView,
        is_default: voice.isDefault,
        created_at: voice.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/brand-voices]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
