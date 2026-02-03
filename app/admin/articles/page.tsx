"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IconMoreVertical,
  IconRefresh,
  IconFlag,
  IconExternalLink,
  IconLoader,
} from "@/components/ui/icons";
import { formatDate } from "@/lib/utils";

interface ArticleRow {
  id: string;
  keyword: string;
  title: string | null;
  status: string;
  seoScore: number | null;
  eeatScore: number | null;
  readabilityScore: number | null;
  wordCount: number | null;
  userEmail: string;
  userName: string | null;
  userId: string;
  createdAt: string;
}

interface ArticlesResponse {
  articles: ArticleRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = [
  "ALL",
  "QUEUED",
  "RESEARCHING",
  "OUTLINING",
  "WRITING",
  "FACT_CHECKING",
  "OPTIMIZING",
  "READY",
  "REVIEWING",
  "PUBLISHED",
  "FAILED",
];

const QUALITY_OPTIONS = [
  { value: "", label: "All Quality" },
  { value: "low", label: "Low Quality (E-E-A-T < 5)" },
  { value: "high", label: "High Quality (E-E-A-T >= 7)" },
];

const statusColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  QUEUED: "secondary",
  RESEARCHING: "outline",
  OUTLINING: "outline",
  WRITING: "outline",
  FACT_CHECKING: "outline",
  OPTIMIZING: "outline",
  READY: "success",
  REVIEWING: "warning",
  PUBLISHED: "default",
  FAILED: "destructive",
};

export default function AdminArticlesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [quality, setQuality] = useState("");
  const [page, setPage] = useState(1);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (quality) params.set("quality", quality);
    params.set("page", String(page));
    return params.toString();
  }, [status, quality, page]);

  const { data, isLoading } = useQuery<ArticlesResponse>({
    queryKey: ["admin-articles", status, quality, page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/articles?${buildParams()}`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
    staleTime: 30_000,
  });

  const regenerateMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", articleId }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
        <p className="text-muted-foreground">
          View and manage all articles across all users.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={quality}
          onChange={(e) => {
            setQuality(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {QUALITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {data && (
          <div className="flex items-center text-sm text-muted-foreground ml-auto">
            {data.total} articles total
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Article</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">SEO</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">E-E-A-T</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Words</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <IconLoader className="mx-auto h-5 w-5" />
                    </td>
                  </tr>
                ) : !data?.articles.length ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No articles found.
                    </td>
                  </tr>
                ) : (
                  data.articles.map((article) => {
                    const isLowQuality = article.eeatScore !== null && article.eeatScore < 5;

                    return (
                      <tr
                        key={article.id}
                        className={`border-b last:border-0 hover:bg-muted/30 ${
                          isLowQuality ? "bg-destructive/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isLowQuality && (
                              <IconFlag className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">
                                {article.title ?? article.keyword}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {article.keyword}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs truncate max-w-[150px]">
                            {article.userEmail}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColors[article.status] ?? "outline"}>
                            {article.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {article.seoScore !== null ? (
                            <ScoreBadge score={article.seoScore} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {article.eeatScore !== null ? (
                            <ScoreBadge score={article.eeatScore} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {article.wordCount?.toLocaleString() ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(article.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                              <IconMoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `/dashboard/articles/${article.id}/edit`,
                                    "_blank"
                                  )
                                }
                              >
                                <IconExternalLink className="mr-2 h-3.5 w-3.5" />
                                View Article
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Regenerate "${article.keyword}"? A new article will be created and 1 credit refunded.`
                                    )
                                  ) {
                                    regenerateMutation.mutate(article.id);
                                  }
                                }}
                              >
                                <IconRefresh className="mr-2 h-3.5 w-3.5" />
                                Regenerate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.total ?? 0} articles)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7
      ? "text-success"
      : score >= 5
        ? "text-warning"
        : "text-destructive";

  return (
    <span className={`font-medium ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}
