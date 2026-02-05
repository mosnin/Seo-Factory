import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ---------- GET: single brand voice ---------- */

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voice = await prisma.brandVoice.findUnique({
      where: { id: params.id },
      include: { _count: { select: { articles: true } } },
    });

    if (!voice || voice.userId !== user.id) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: voice.id,
      name: voice.name,
      tone: voice.tone,
      point_of_view: voice.pointOfView,
      exemplar_content: voice.exemplarContent,
      guidelines: voice.guidelines,
      forbidden_phrases: voice.forbiddenPhrases,
      is_default: voice.isDefault,
      embedding_id: voice.embeddingId,
      articles_count: voice._count.articles,
      created_at: voice.createdAt,
      updated_at: voice.updatedAt,
    });
  } catch (error) {
    console.error("[GET /api/brand-voices/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- PATCH: update brand voice ---------- */

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  tone: z.string().min(1).optional(),
  point_of_view: z.string().min(1).optional(),
  guidelines: z.string().max(2000).optional().nullable(),
  exemplar_content: z.string().max(5000).optional().nullable(),
  forbidden_phrases: z.string().max(1000).optional().nullable(),
  is_default: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.brandVoice.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
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
        where: { userId: user.id, isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    // Re-generate embedding if exemplar content changed
    let embeddingId: string | undefined;
    if (exemplar_content !== undefined) {
      if (exemplar_content && exemplar_content.trim().length > 0) {
        // TODO: Generate embedding via OpenAI API and store
        embeddingId = undefined; // keep existing for now
      } else {
        embeddingId = undefined;
      }
    }

    const voice = await prisma.brandVoice.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(tone !== undefined && { tone }),
        ...(point_of_view !== undefined && { pointOfView: point_of_view }),
        ...(guidelines !== undefined && { guidelines }),
        ...(exemplar_content !== undefined && {
          exemplarContent: exemplar_content,
        }),
        ...(forbidden_phrases !== undefined && {
          forbiddenPhrases: forbidden_phrases,
        }),
        ...(is_default !== undefined && { isDefault: is_default }),
        ...(embeddingId !== undefined && { embeddingId }),
      },
    });

    return NextResponse.json({
      id: voice.id,
      name: voice.name,
      updated_at: voice.updatedAt,
    });
  } catch (error) {
    console.error("[PATCH /api/brand-voices/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE: remove brand voice ---------- */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.brandVoice.findUnique({
      where: { id: params.id },
      include: { _count: { select: { articles: true } } },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Brand voice not found" },
        { status: 404 }
      );
    }

    await prisma.brandVoice.delete({ where: { id: params.id } });

    return NextResponse.json({
      deleted: true,
      articles_affected: existing._count.articles,
    });
  } catch (error) {
    console.error("[DELETE /api/brand-voices/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
