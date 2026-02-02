import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const articleCount = await prisma.article.count();
  const publishedCount = await prisma.article.count({
    where: { status: "PUBLISHED" },
  });

  const stats = [
    { label: "Total Articles", value: articleCount },
    { label: "Published", value: publishedCount },
    { label: "In Progress", value: articleCount - publishedCount },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your content pipeline.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
