"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  type: "keyword" | "citation" | "readability" | "structure";
  message: string;
  severity: "info" | "warning" | "critical";
}

function getMockSuggestions(keyword: string): Suggestion[] {
  return [
    {
      id: "sug-1",
      type: "keyword",
      message: `Consider adding "${keyword}" in an H2 heading for better keyword placement.`,
      severity: "warning",
    },
    {
      id: "sug-2",
      type: "citation",
      message:
        "The statistics section could benefit from a citation to improve E-E-A-T signals.",
      severity: "info",
    },
    {
      id: "sug-3",
      type: "readability",
      message:
        "Paragraph 3 has sentences averaging 32 words. Consider breaking them up for readability.",
      severity: "warning",
    },
    {
      id: "sug-4",
      type: "structure",
      message:
        "Adding a FAQ section with schema markup could improve featured snippet chances.",
      severity: "info",
    },
    {
      id: "sug-5",
      type: "keyword",
      message:
        "Keyword density is below 1%. Try using the target keyword one more time in the body.",
      severity: "critical",
    },
  ];
}

const severityColors = {
  info: "border-l-primary bg-primary/5",
  warning: "border-l-warning bg-warning/5",
  critical: "border-l-destructive bg-destructive/5",
};

const typeLabels: Record<Suggestion["type"], string> = {
  keyword: "Keyword",
  citation: "Citation",
  readability: "Readability",
  structure: "Structure",
};

interface SuggestionsTabProps {
  keyword: string;
}

export function SuggestionsTab({ keyword }: SuggestionsTabProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const suggestions = getMockSuggestions(keyword);
  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl">&#10003;</div>
        <p className="mt-2 text-sm font-medium">All suggestions addressed!</p>
        <p className="text-xs text-muted-foreground">
          Your article looks great.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {visible.length} suggestion{visible.length !== 1 && "s"} to improve your
        article
      </p>
      {visible.map((s) => (
        <div
          key={s.id}
          className={cn(
            "rounded-md border-l-4 p-3",
            severityColors[s.severity]
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground">
              {typeLabels[s.type]}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{s.message}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() =>
                setDismissed((prev) => new Set([...Array.from(prev), s.id]))
              }
            >
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
