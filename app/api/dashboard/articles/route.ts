import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const perPage = Math.min(50, Math.max(1, Number(searchParams.get("per_page") ?? "10")));
    const skip = (page - 1) * perPage;

    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          title: true,
          keyword: true,
          status: true,
          eeatScore: true,
          seoScore: true,
          createdAt: true,
        },
      }),
      prisma.article.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        keyword: a.keyword,
        status: a.status,
        eeat_score: a.eeatScore,
        seo_score: a.seoScore,
        created_at: a.createdAt.toISOString(),
      })),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("[GET /api/dashboard/articles]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
