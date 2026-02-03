"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconUsers,
  IconTrendingUp,
  IconCoins,
  IconTrendingDown,
  IconLoader,
} from "@/components/ui/icons";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { PlanPieChart } from "@/components/admin/plan-pie-chart";
import { CreditUsageChart } from "@/components/admin/credit-usage-chart";

interface AnalyticsData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    mrr: number;
    churnRate: number;
  };
  planDistribution: { name: string; value: number }[];
  creditUsage: { tier: string; credits: number }[];
  revenueTimeline: { date: string; credits: number }[];
  topKeywords: { keyword: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <IconLoader className="h-6 w-6" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform metrics and usage insights.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data.metrics.totalUsers.toLocaleString()}
          icon={<IconUsers className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Users (30d)"
          value={data.metrics.activeUsers.toLocaleString()}
          icon={<IconTrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="MRR"
          value={`$${data.metrics.mrr.toLocaleString()}`}
          icon={<IconCoins className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Churn Rate"
          value={`${data.metrics.churnRate}%`}
          icon={<IconTrendingDown className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time (Last 90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenueTimeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanPieChart data={data.planDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <CreditUsageChart data={data.creditUsage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Keywords (Last 90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      Keyword
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      Articles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topKeywords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No keyword data yet.
                      </td>
                    </tr>
                  ) : (
                    data.topKeywords.map((k, i) => (
                      <tr key={k.keyword} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 font-medium">{k.keyword}</td>
                        <td className="py-2 text-right tabular-nums">
                          {k.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
