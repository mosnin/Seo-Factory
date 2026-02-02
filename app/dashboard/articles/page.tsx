import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your generated content.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="pb-3 font-medium">Keyword</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Brand Voice</th>
              <th className="pb-3 font-medium">SEO Score</th>
              <th className="pb-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map((article) => (
              <tr key={article.id}>
                <td className="py-3 font-medium text-gray-900">
                  {article.keyword}
                </td>
                <td className="py-3">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                    {article.status}
                  </span>
                </td>
                <td className="py-3 text-gray-600">
                  {article.brandVoice?.name ?? "—"}
                </td>
                <td className="py-3 text-gray-600">
                  {article.seoScore ? `${article.seoScore}%` : "—"}
                </td>
                <td className="py-3 text-gray-600">
                  {formatDate(article.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
