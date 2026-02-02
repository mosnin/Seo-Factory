import { NextRequest, NextResponse } from "next/server";
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
