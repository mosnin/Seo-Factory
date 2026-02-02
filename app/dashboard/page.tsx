import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const articleCount = await prisma.article.count();
  const publishedCount = await prisma.article.count({
    where: { status: "PUBLISHED" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">
        Overview of your content pipeline.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Articles</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {articleCount}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Published</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">In Progress</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {articleCount - publishedCount}
          </p>
        </div>
      </div>
    </div>
  );
}
