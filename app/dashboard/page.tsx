import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { RecentArticlesTable } from "@/components/dashboard/recent-articles-table";
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Pre-fetch quick counts for SSR (visible while client hydrates)
  const user = await prisma.user.findFirst();
  const creditsBalance = user?.creditsBalance ?? 0;

  return (
    <div>
      {/* Onboarding modal (shows when onboarding not completed) */}
      <OnboardingWrapper />

      {/* Header with Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your content pipeline.
          </p>
        </div>
        <a href="/dashboard/articles/new">
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Generate New Article
          </Button>
        </a>
      </div>

      {/* Metric Cards (client component with React Query) */}
      <div className="mt-6">
        <MetricCards />
      </div>

      {/* Recent Articles Table */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Articles
          </h2>
          <a
            href="/dashboard/articles"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </a>
        </div>
        <RecentArticlesTable />
      </div>
    </div>
  );
}
