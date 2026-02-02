import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        brandVoice: { select: { id: true, name: true } },
        citations: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: article.id,
      keyword: article.keyword,
      title: article.title,
      slug: article.slug,
      status: article.status,
      outline: article.outlineJson,
      serp_data: article.serpDataJson,
      target_length: article.targetLength,
      content_html: article.contentHtml,
      content_markdown: article.contentMarkdown,
      meta_description: article.metaDescription,
      word_count: article.wordCount,
      readability_score: article.readabilityScore,
      seo_score: article.seoScore,
      citations_count: article.citationsCount,
      keyword_density: article.keywordDensity,
      eeat_score: article.eeatScore,
      schema_markup: article.schemaMarkupJson,
      generation_time_sec: article.generationTimeSec,
      brand_voice: article.brandVoice,
      citations: article.citations,
      error_message: article.errorMessage,
      retry_count: article.retryCount,
      created_at: article.createdAt,
      updated_at: article.updatedAt,
    });
  } catch (error) {
    console.error("[GET /api/articles/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const patchArticleSchema = z.object({
  title: z.string().max(300).optional(),
  content_html: z.string().optional(),
  content_markdown: z.string().optional(),
  meta_description: z.string().max(320).optional(),
  status: z.enum(["READY", "REVIEWING", "PUBLISHED"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = patchArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.article.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const { title, content_html, content_markdown, meta_description, status } =
      parsed.data;

    // Count words from HTML content if provided
    let wordCount: number | undefined;
    if (content_html) {
      const text = content_html.replace(/<[^>]*>/g, " ");
      wordCount = text
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
    }

    const article = await prisma.article.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content_html !== undefined && { contentHtml: content_html }),
        ...(content_markdown !== undefined && {
          contentMarkdown: content_markdown,
        }),
        ...(meta_description !== undefined && {
          metaDescription: meta_description,
        }),
        ...(status !== undefined && { status }),
        ...(wordCount !== undefined && { wordCount }),
      },
    });

    return NextResponse.json({
      id: article.id,
      updated_at: article.updatedAt,
      word_count: article.wordCount,
    });
  } catch (error) {
    console.error("[PATCH /api/articles/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
