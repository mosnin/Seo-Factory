"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface HeadingNode {
  level: number;
  text: string;
  id: string;
}

function parseHeadings(html: string): HeadingNode[] {
  const regex = /<h([1-3])[^>]*>(.*?)<\/h[1-3]>/gi;
  const headings: HeadingNode[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (text) {
      headings.push({
        level: parseInt(match[1], 10),
        text,
        id: `heading-${headings.length}`,
      });
    }
  }
  return headings;
}

interface OutlineTabProps {
  contentHtml: string;
  onScrollTo?: (text: string) => void;
}

export function OutlineTab({ contentHtml, onScrollTo }: OutlineTabProps) {
  const headings = useMemo(() => parseHeadings(contentHtml), [contentHtml]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (headings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No headings found in your article.
        </p>
        <p className="text-xs text-muted-foreground">
          Add H2 or H3 headings to see the outline.
        </p>
      </div>
    );
  }

  // Build tree structure for collapsing
  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Check if a heading's children should be hidden
  function isChildHidden(index: number): boolean {
    for (let i = index - 1; i >= 0; i--) {
      if (headings[i].level < headings[index].level) {
        return collapsed.has(headings[i].id);
      }
    }
    return false;
  }

  // Check if heading has children
  function hasChildren(index: number): boolean {
    if (index >= headings.length - 1) return false;
    return headings[index + 1].level > headings[index].level;
  }

  return (
    <div className="space-y-0.5">
      <p className="mb-3 text-xs text-muted-foreground">
        {headings.length} heading{headings.length !== 1 && "s"} &middot; Click
        to navigate
      </p>
      {headings.map((h, i) => {
        if (isChildHidden(i)) return null;

        const indent = (h.level - 1) * 16;
        const isH2 = h.level <= 2;
        const canCollapse = hasChildren(i);
        const isCollapsed = collapsed.has(h.id);

        return (
          <div
            key={h.id}
            className={cn(
              "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent cursor-pointer",
              isH2 ? "font-medium" : "text-muted-foreground"
            )}
            style={{ paddingLeft: `${indent + 8}px` }}
            onClick={() => onScrollTo?.(h.text)}
          >
            {canCollapse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(h.id);
                }}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-secondary"
              >
                <svg
                  className={cn(
                    "h-3 w-3 transition-transform",
                    isCollapsed && "-rotate-90"
                  )}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            )}
            {!canCollapse && <span className="w-4 shrink-0" />}
            <span className="truncate">{h.text}</span>
          </div>
        );
      })}
    </div>
  );
}
