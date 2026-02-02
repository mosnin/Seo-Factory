"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArticleEditor, useEditorWordCount } from "@/components/editor/article-editor";
import { EditorTopToolbar } from "@/components/editor/editor-toolbar";
import { SuggestionsTab } from "@/components/editor/suggestions-tab";
import { OutlineTab } from "@/components/editor/outline-tab";
import { AnalyticsTab } from "@/components/editor/analytics-tab";
import { CitationsTab } from "@/components/editor/citations-tab";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */

interface ArticleCitation {
  id: string;
  claimText: string;
  sourceUrl: string;
  sourceTitle: string | null;
  confidence: number;
  needsReview: boolean;
}

interface ArticleData {
  id: string;
  keyword: string;
  title: string | null;
  status: string;
  content_html: string | null;
  content_markdown: string | null;
  meta_description: string | null;
  word_count: number | null;
  readability_score: number | null;
  seo_score: number | null;
  keyword_density: number | null;
  eeat_score: number | null;
  target_length: number;
  citations: ArticleCitation[];
  updated_at: string;
}

/* ---------- Tabs config ---------- */

const TABS = ["Suggestions", "Outline", "Analytics", "Citations"] as const;
type Tab = (typeof TABS)[number];

/* ---------- Skeleton ---------- */

function EditorSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] animate-pulse flex-col">
      {/* Top bar skeleton */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="flex-1" />
        <div className="h-8 w-16 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
      <div className="flex flex-1">
        {/* Editor skeleton */}
        <div className="flex-[3] border-r p-6">
          <div className="mb-4 h-8 w-3/4 rounded bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-muted"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        </div>
        {/* Sidebar skeleton */}
        <div className="flex-[2] p-4">
          <div className="mb-4 flex gap-2">
            {TABS.map((t) => (
              <div key={t} className="h-8 w-20 rounded bg-muted" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function ArticleEditPage() {
  const params = useParams();
  const articleId = params.id as string;

  // Article data
  const {
    data: article,
    isLoading,
    error,
  } = useQuery<ArticleData>({
    queryKey: ["article", articleId],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) throw new Error("Failed to load article");
      return res.json();
    },
  });

  // Editor content
  const [contentHtml, setContentHtml] = useState("");
  const [title, setTitle] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Suggestions");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const wordCount = useEditorWordCount(contentHtml);

  // Populate from article data on load
  const initialized = useRef(false);
  useEffect(() => {
    if (article && !initialized.current) {
      setContentHtml(article.content_html ?? "");
      setTitle(article.title ?? "");
      initialized.current = true;
    }
  }, [article]);

  // Auto-save every 30 seconds
  const contentRef = useRef(contentHtml);
  const titleRef = useRef(title);
  contentRef.current = contentHtml;
  titleRef.current = title;

  const save = useCallback(async () => {
    if (!article) return;
    setIsSaving(true);
    try {
      await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleRef.current,
          content_html: contentRef.current,
        }),
      });
      setLastSaved(new Date());
    } catch {
      // Silently fail - will retry on next interval
    } finally {
      setIsSaving(false);
    }
  }, [article]);

  useEffect(() => {
    if (!article) return;
    const interval = setInterval(save, 30_000);
    return () => clearInterval(interval);
  }, [article, save]);

  // Handle outline click-to-scroll
  const handleScrollTo = useCallback((text: string) => {
    // Find the heading element in the editor by text content
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    const headings = Array.from(editorEl.querySelectorAll("h1, h2, h3"));
    const match = headings.find((h) => h.textContent?.trim() === text);
    if (match) {
      match.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Handle publish
  const handlePublish = useCallback(
    async (method: string) => {
      if (!article) return;
      if (method === "wordpress") return; // not yet implemented
      // Mark as PUBLISHED for download actions
      await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
    },
    [article]
  );

  if (isLoading) return <EditorSkeleton />;

  if (error || !article) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Article not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The article may have been deleted or you don&apos;t have access.
          </p>
          <a
            href="/dashboard/articles"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Back to articles
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-8 flex h-[calc(100vh-4rem)] flex-col lg:-mx-8">
      {/* Top toolbar */}
      <EditorTopToolbar
        title={title}
        contentHtml={contentHtml}
        contentMarkdown={article.content_markdown}
        status={article.status}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onSave={save}
        onPublish={handlePublish}
      />

      {/* 60/40 split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane - Editor (60%) */}
        <div className="flex flex-[3] flex-col overflow-hidden border-r">
          {/* Title input */}
          <div className="border-b px-6 py-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full bg-transparent text-xl font-bold placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>

          {/* TipTap editor */}
          <div className="flex-1 overflow-y-auto">
            <ArticleEditor
              initialContent={article.content_html ?? ""}
              onUpdate={setContentHtml}
              className="h-full rounded-none border-0"
            />
          </div>

          {/* Word count bar */}
          <div className="flex items-center justify-between border-t px-4 py-1.5 text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString()} words</span>
            <span>Target: {article.target_length.toLocaleString()}</span>
          </div>
        </div>

        {/* Right pane - Tabs (40%) */}
        <div className="flex flex-[2] flex-col overflow-hidden">
          {/* Tab headers */}
          <div className="flex border-b">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 border-b-2 px-2 py-2.5 text-xs font-medium transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "Suggestions" && (
              <SuggestionsTab keyword={article.keyword} />
            )}
            {activeTab === "Outline" && (
              <OutlineTab
                contentHtml={contentHtml}
                onScrollTo={handleScrollTo}
              />
            )}
            {activeTab === "Analytics" && (
              <AnalyticsTab
                seoScore={article.seo_score}
                readabilityScore={article.readability_score}
                eeatScore={article.eeat_score}
                keywordDensity={article.keyword_density}
                wordCount={wordCount}
                targetLength={article.target_length}
                keyword={article.keyword}
              />
            )}
            {activeTab === "Citations" && (
              <CitationsTab citations={article.citations} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
