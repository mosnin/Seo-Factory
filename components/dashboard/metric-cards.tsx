"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Sparkline } from "./sparkline";
import { IconCoins, IconFileText, IconLoader } from "@/components/ui/icons";

interface DashboardStats {
  credits_balance: number;
  articles_this_month: number;
  avg_quality_score: number | null;
  completed_articles: number;
  time_saved_hours: number;
  sparkline_data: number[];
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function MetricCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const creditColor =
    data.credits_balance > 20
      ? "text-success"
      : data.credits_balance >= 10
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Credits Remaining */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Credits Remaining
          </p>
          <IconCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <p className={cn("text-3xl font-bold", creditColor)}>
              {data.credits_balance}
            </p>
            <a
              href="/dashboard/billing"
              className="text-xs font-medium text-primary hover:underline"
            >
              Buy Credits
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Articles This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Articles This Month
          </p>
          <IconFileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4">
            <p className="text-3xl font-bold">{data.articles_this_month}</p>
            <Sparkline
              data={data.sparkline_data}
              className="h-8 w-24 text-primary"
              strokeColor="currentColor"
              fillColor="currentColor"
            />
          </div>
        </CardContent>
      </Card>

      {/* Avg Quality Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Avg Quality Score
          </p>
          <IconQualityStar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold">
              {data.avg_quality_score ?? "\u2014"}
            </p>
            {data.avg_quality_score !== null && (
              <p className="mb-1 text-sm text-muted-foreground">/ 10</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Saved */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">
            Time Saved
          </p>
          <IconClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold">{data.time_saved_hours}</p>
            <p className="mb-1 text-sm text-muted-foreground">hours</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Inline mini-icons */
function IconQualityStar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
