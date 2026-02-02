import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/dashboard/article-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { IconPlus } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { brandVoice: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your generated content.
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No articles yet"
          description="Create your first SEO-optimized article. Enter a keyword and let AI handle the rest."
          actionLabel="Create Article"
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              keyword={article.keyword}
              title={article.title}
              status={article.status}
              seoScore={article.seoScore}
              readabilityScore={article.readabilityScore}
              wordCount={article.wordCount}
              brandVoiceName={article.brandVoice?.name}
              createdAt={article.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
