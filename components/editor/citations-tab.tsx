"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Citation {
  id: string;
  claimText: string;
  sourceUrl: string;
  sourceTitle: string | null;
  confidence: number;
  needsReview: boolean;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const variant =
    confidence >= 8 ? "success" : confidence >= 5 ? "warning" : "destructive";
  return (
    <Badge variant={variant} className="text-[10px]">
      {confidence}/10
    </Badge>
  );
}

interface CitationsTabProps {
  citations: Citation[];
}

export function CitationsTab({ citations }: CitationsTabProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const reviewCount = citations.filter((c) => c.needsReview).length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {citations.length} citation{citations.length !== 1 && "s"}
          {reviewCount > 0 && (
            <span className="text-warning">
              {" "}
              &middot; {reviewCount} need{reviewCount === 1 ? "s" : ""} review
            </span>
          )}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setShowSearch(!showSearch)}
        >
          Add Citation
        </Button>
      </div>

      {/* Search Modal (inline) */}
      {showSearch && (
        <div className="rounded-md border bg-secondary/30 p-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a source..."
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-2 text-[10px] text-muted-foreground">
            Citation search will be available in a future update.
          </p>
        </div>
      )}

      {/* Citations list */}
      {citations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-muted-foreground">No citations yet.</p>
          <p className="text-xs text-muted-foreground">
            Citations are added automatically during fact-checking.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {citations.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                "rounded-md border p-3",
                c.needsReview && "border-warning/50 bg-warning/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-bold text-muted-foreground">
                      [{i + 1}]
                    </span>
                    <span className="truncate text-sm font-medium">
                      {c.sourceTitle ?? extractDomain(c.sourceUrl)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {extractDomain(c.sourceUrl)}
                  </p>
                </div>
                <ConfidenceBadge confidence={c.confidence} />
              </div>
              <p className="mt-2 border-l-2 border-muted pl-2 text-xs italic text-muted-foreground">
                &ldquo;{c.claimText}&rdquo;
              </p>
              {c.needsReview && (
                <p className="mt-1.5 text-[10px] font-medium text-warning">
                  Low confidence &mdash; manual review recommended
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
