"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconChevronLeft, IconLoader, IconCheck, IconAlertTriangle, IconCoins } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { LENGTH_PRESETS, type LengthPreset } from "@/lib/constants";

/* ---------- Types ---------- */

interface BrandVoice {
  id: string;
  name: string;
  tone: string;
  pointOfView: string;
}

interface StreamEvent {
  status: string;
  message: string;
  seo_score?: number | null;
  readability_score?: number | null;
  word_count?: number | null;
  error_message?: string | null;
}

type ModalState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "streaming"; articleId: string; event: StreamEvent }
  | { phase: "success"; articleId: string; seoScore: number | null; readabilityScore: number | null; wordCount: number | null }
  | { phase: "error"; message: string };

/* ---------- Fetchers ---------- */

async function fetchBrandVoices(): Promise<BrandVoice[]> {
  const res = await fetch("/api/brand-voices");
  if (!res.ok) return [];
  const data = await res.json();
  return data.brand_voices ?? [];
}

async function fetchCredits(): Promise<number> {
  const res = await fetch("/api/dashboard/stats");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.credits_balance ?? 0;
}

/* ---------- Stage progress config ---------- */

const STAGE_ORDER = ["QUEUED", "RESEARCHING", "OUTLINING", "WRITING", "FACT_CHECKING", "OPTIMIZING", "READY"] as const;

const STAGE_LABELS: Record<string, string> = {
  QUEUED: "Preparing your article...",
  RESEARCHING: "Researching top search results...",
  OUTLINING: "Creating optimized outline...",
  WRITING: "Drafting article content...",
  FACT_CHECKING: "Fact-checking and adding citations...",
  OPTIMIZING: "Optimizing for SEO...",
  READY: "Article complete!",
};

/* ---------- Component ---------- */

export default function NewArticlePage() {
  const router = useRouter();

  // Form state
  const [keyword, setKeyword] = useState("");
  const [brandVoiceId, setBrandVoiceId] = useState("");
  const [lengthPreset, setLengthPreset] = useState<LengthPreset>("medium");
  const [contentBrief, setContentBrief] = useState("");

  // Modal state
  const [modal, setModal] = useState<ModalState>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  // Data fetching
  const { data: brandVoices = [] } = useQuery({
    queryKey: ["brand-voices"],
    queryFn: fetchBrandVoices,
  });

  const { data: credits = 0 } = useQuery({
    queryKey: ["credits"],
    queryFn: fetchCredits,
  });

  const selectedPreset = LENGTH_PRESETS[lengthPreset];
  const creditCost = selectedPreset.credits;
  const hasEnoughCredits = credits >= creditCost;

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const connectSSE = useCallback((articleId: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`/api/articles/${articleId}/stream`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const chunk of lines) {
            const dataLine = chunk.trim().replace(/^data: /, "");
            if (!dataLine) continue;

            try {
              const event: StreamEvent = JSON.parse(dataLine);

              if (event.status === "READY") {
                setModal({
                  phase: "success",
                  articleId,
                  seoScore: event.seo_score ?? null,
                  readabilityScore: event.readability_score ?? null,
                  wordCount: event.word_count ?? null,
                });
                return;
              }

              if (event.status === "FAILED") {
                setModal({
                  phase: "error",
                  message: event.error_message ?? "Article generation failed. Your credits have been automatically refunded.",
                });
                return;
              }

              setModal({ phase: "streaming", articleId, event });
            } catch {
              // skip invalid JSON
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setModal({
          phase: "error",
          message: "Lost connection to the server. Your credits have been automatically refunded if generation failed.",
        });
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim() || !hasEnoughCredits) return;

    setModal({ phase: "submitting" });

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          brand_voice_id: brandVoiceId || undefined,
          length_preset: lengthPreset,
          content_brief: contentBrief.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setModal({
          phase: "error",
          message: data.error ?? "Failed to create article",
        });
        return;
      }

      const data = await res.json();
      connectSSE(data.article_id);
      setModal({
        phase: "streaming",
        articleId: data.article_id,
        event: { status: "QUEUED", message: "Preparing your article..." },
      });
    } catch {
      setModal({
        phase: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  function handleTryAgain() {
    abortRef.current?.abort();
    setModal({ phase: "idle" });
  }

  const showModal = modal.phase !== "idle";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/dashboard/articles">
          <Button variant="ghost" size="icon">
            <IconChevronLeft className="h-5 w-5" />
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Article</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter a keyword and let AI generate an SEO-optimized article.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
        {/* Keyword */}
        <div className="space-y-2">
          <label htmlFor="keyword" className="text-sm font-medium">
            Target Keyword <span className="text-destructive">*</span>
          </label>
          <input
            id="keyword"
            type="text"
            required
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. best project management tools 2025"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>

        {/* Brand Voice */}
        <div className="space-y-2">
          <label htmlFor="brand-voice" className="text-sm font-medium">
            Brand Voice
          </label>
          <select
            id="brand-voice"
            value={brandVoiceId}
            onChange={(e) => setBrandVoiceId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="">Default voice</option>
            {brandVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} — {voice.tone}
              </option>
            ))}
          </select>
          {brandVoices.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No brand voices configured.{" "}
              <a href="/dashboard/brand-voices" className="text-primary hover:underline">
                Create one
              </a>
            </p>
          )}
        </div>

        {/* Length Radio Buttons */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Article Length</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.entries(LENGTH_PRESETS) as [LengthPreset, typeof LENGTH_PRESETS[LengthPreset]][]).map(
              ([key, preset]) => (
                <label
                  key={key}
                  className={cn(
                    "relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors hover:bg-accent/50",
                    lengthPreset === key
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-input"
                  )}
                >
                  <input
                    type="radio"
                    name="length"
                    value={key}
                    checked={lengthPreset === key}
                    onChange={() => setLengthPreset(key)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{preset.label}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {preset.range}
                  </span>
                  <div className="mt-2 flex items-center gap-1">
                    <IconCoins className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-medium">
                      {preset.credits} credit{preset.credits !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {key === "medium" && (
                    <Badge variant="secondary" className="absolute right-2 top-2 text-[10px]">
                      Default
                    </Badge>
                  )}
                </label>
              )
            )}
          </div>
        </div>

        {/* Content Brief */}
        <div className="space-y-2">
          <label htmlFor="content-brief" className="text-sm font-medium">
            Content Brief{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="content-brief"
            value={contentBrief}
            onChange={(e) => setContentBrief(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            placeholder="Provide any specific instructions, angle, or points to cover..."
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <p className="text-xs text-muted-foreground text-right">
            {contentBrief.length}/500
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={!keyword.trim() || !hasEnoughCredits || modal.phase !== "idle"}
          >
            Generate Article
          </Button>
          {!hasEnoughCredits && (
            <p className="text-sm text-destructive">
              Insufficient credits. You need {creditCost} but have {credits}.{" "}
              <a href="/dashboard/billing" className="underline">
                Upgrade plan
              </a>
            </p>
          )}
          {hasEnoughCredits && (
            <p className="text-sm text-muted-foreground">
              This will use {creditCost} credit{creditCost !== 1 ? "s" : ""}. You have {credits} remaining.
            </p>
          )}
        </div>
      </form>

      {/* Progress Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>
                {modal.phase === "submitting" && "Starting Generation..."}
                {modal.phase === "streaming" && "Generating Article"}
                {modal.phase === "success" && "Article Ready!"}
                {modal.phase === "error" && "Generation Failed"}
              </CardTitle>
              <CardDescription>
                {modal.phase === "submitting" && "Sending your request..."}
                {modal.phase === "streaming" && `"${keyword}"`}
                {modal.phase === "success" && `"${keyword}"`}
                {modal.phase === "error" && "Something went wrong"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Submitting spinner */}
              {modal.phase === "submitting" && (
                <div className="flex justify-center py-8">
                  <IconLoader className="h-8 w-8 text-primary" />
                </div>
              )}

              {/* Streaming progress */}
              {modal.phase === "streaming" && (
                <div className="space-y-6">
                  {/* Stage steps */}
                  <div className="space-y-2">
                    {STAGE_ORDER.map((stage, i) => {
                      const currentIdx = STAGE_ORDER.indexOf(
                        modal.event.status as typeof STAGE_ORDER[number]
                      );
                      const isCompleted = i < currentIdx;
                      const isCurrent = i === currentIdx;
                      const isPending = i > currentIdx;

                      if (stage === "READY") return null;

                      return (
                        <div
                          key={stage}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isCurrent && "bg-primary/10 text-primary font-medium",
                            isCompleted && "text-muted-foreground",
                            isPending && "text-muted-foreground/40"
                          )}
                        >
                          {isCompleted ? (
                            <IconCheck className="h-4 w-4 shrink-0 text-success" />
                          ) : isCurrent ? (
                            <IconLoader className="h-4 w-4 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 shrink-0 rounded-full border border-current opacity-30" />
                          )}
                          <span>{STAGE_LABELS[stage]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Success */}
              {modal.phase === "success" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                      <IconCheck className="h-8 w-8 text-success" />
                    </div>
                  </div>

                  {/* Quality scores */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {modal.seoScore !== null && (
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(modal.seoScore)}
                        </p>
                        <p className="text-xs text-muted-foreground">SEO Score</p>
                      </div>
                    )}
                    {modal.readabilityScore !== null && (
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(modal.readabilityScore)}
                        </p>
                        <p className="text-xs text-muted-foreground">Readability</p>
                      </div>
                    )}
                    {modal.wordCount !== null && (
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {modal.wordCount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Words</p>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push(`/dashboard/articles/${modal.articleId}/edit`)}
                  >
                    View Article
                  </Button>
                </div>
              )}

              {/* Error */}
              {modal.phase === "error" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <IconAlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {modal.message}
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    Credits are automatically refunded when generation fails.
                  </p>
                  <Button className="w-full" size="lg" onClick={handleTryAgain}>
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
