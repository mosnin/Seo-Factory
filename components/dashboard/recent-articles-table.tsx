"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IconMoreVertical,
  IconPencil,
  IconExternalLink,
  IconTrash,
} from "@/components/ui/icons";

type ArticleStatus =
  | "QUEUED"
  | "RESEARCHING"
  | "OUTLINING"
  | "WRITING"
  | "FACT_CHECKING"
  | "OPTIMIZING"
  | "READY"
  | "REVIEWING"
  | "PUBLISHED"
  | "FAILED";

interface ArticleRow {
  id: string;
  title: string | null;
  keyword: string;
  status: ArticleStatus;
  eeat_score: number | null;
  seo_score: number | null;
  created_at: string;
}

interface ArticlesResponse {
  articles: ArticleRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const statusConfig: Record<
  ArticleStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }
> = {
  QUEUED: { label: "Queued", variant: "secondary" },
  RESEARCHING: { label: "Researching", variant: "outline" },
  OUTLINING: { label: "Outlining", variant: "outline" },
  WRITING: { label: "Drafting", variant: "warning" },
  FACT_CHECKING: { label: "Fact-Checking", variant: "warning" },
  OPTIMIZING: { label: "Optimizing", variant: "warning" },
  READY: { label: "Ready", variant: "success" },
  REVIEWING: { label: "Reviewing", variant: "warning" },
  PUBLISHED: { label: "Published", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

async function fetchArticles(page: number): Promise<ArticlesResponse> {
  const res = await fetch(`/api/dashboard/articles?page=${page}&per_page=10`);
  if (!res.ok) throw new Error("Failed to fetch articles");
  return res.json();
}

function QualityDot({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  const color =
    score >= 7
      ? "bg-success"
      : score >= 4
        ? "bg-warning"
        : "bg-destructive";

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-sm">{score.toFixed(1)}</span>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border p-4"
        >
          <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function RecentArticlesTable() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-articles", page],
    queryFn: () => fetchArticles(page),
    refetchInterval: 15_000,
  });

  if (isLoading) return <TableSkeleton />;

  if (!data || data.articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">No articles yet</p>
        <a href="/dashboard/articles" className="mt-2">
          <Button size="sm">Create your first article</Button>
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Title
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Keyword
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Quality
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 font-medium text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.articles.map((article) => {
              const cfg = statusConfig[article.status];
              return (
                <tr
                  key={article.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">
                    {article.title
                      ? truncate(article.title, 45)
                      : <span className="text-muted-foreground italic">Untitled</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {truncate(article.keyword, 30)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <QualityDot score={article.eeat_score} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(article.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        <IconMoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <IconPencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconExternalLink className="mr-2 h-3.5 w-3.5" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconPublish className="mr-2 h-3.5 w-3.5" />
                          Publish
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive>
                          <IconTrash className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.total_pages} ({data.total} articles)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Inline publish icon */
function IconPublish({ className }: { className?: string }) {
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
      <path d="M12 17V3" />
      <path d="m6 11 6-8 6 8" />
      <path d="M19 21H5" />
    </svg>
  );
}
