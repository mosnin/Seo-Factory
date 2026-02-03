"use client";

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  IconLoader,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconSparkles,
  IconArrowRight,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/* ---------- Constants ---------- */

const TONE_OPTIONS = [
  { value: "Professional", description: "Formal and business-oriented" },
  { value: "Conversational", description: "Friendly and approachable" },
  { value: "Technical", description: "In-depth and detailed" },
  { value: "Authoritative", description: "Expert and confident" },
] as const;

const POV_OPTIONS = [
  { value: "We/Us", label: "We/Us", description: "First person plural" },
  { value: "You", label: "You", description: "Second person" },
  { value: "Third Person", label: "Third Person", description: "He/She/They" },
] as const;

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "E-commerce",
  "Marketing",
  "Education",
  "Real Estate",
  "Legal",
  "Travel",
  "Food & Beverage",
  "Other",
] as const;

const STAGE_ORDER = [
  "QUEUED",
  "RESEARCHING",
  "OUTLINING",
  "WRITING",
  "FACT_CHECKING",
  "OPTIMIZING",
  "READY",
] as const;

const STAGE_LABELS: Record<string, string> = {
  QUEUED: "Preparing your article...",
  RESEARCHING: "Researching top search results...",
  OUTLINING: "Creating optimized outline...",
  WRITING: "Drafting article content...",
  FACT_CHECKING: "Fact-checking and adding citations...",
  OPTIMIZING: "Optimizing for SEO...",
  READY: "Article complete!",
};

/* ---------- Types ---------- */

interface StreamEvent {
  status: string;
  message: string;
  seo_score?: number | null;
  readability_score?: number | null;
  word_count?: number | null;
  error_message?: string | null;
}

type GenerationState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "streaming"; articleId: string; event: StreamEvent }
  | {
      phase: "success";
      articleId: string;
      seoScore: number | null;
      readabilityScore: number | null;
      wordCount: number | null;
    }
  | { phase: "error"; message: string };

interface OnboardingModalProps {
  userName?: string;
  onComplete?: () => void;
}

/* ---------- Component ---------- */

export function OnboardingModal({ userName, onComplete }: OnboardingModalProps) {
  const router = useRouter();

  // Step state (1-4)
  const [step, setStep] = useState(1);

  // Step 2: Brand voice
  const [tone, setTone] = useState("Professional");
  const [pov, setPov] = useState("We/Us");
  const [exemplarContent, setExemplarContent] = useState("");

  // Step 3: Content focus
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  // Step 4: Article generation
  const [articleKeyword, setArticleKeyword] = useState("");
  const [generation, setGeneration] = useState<GenerationState>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Tag input handlers for keywords
  const addKeyword = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !keywords.includes(trimmed) && keywords.length < 5) {
        setKeywords((prev) => [...prev, trimmed]);
      }
      setKeywordInput("");
    },
    [keywords]
  );

  const removeKeyword = useCallback((index: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeywordKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addKeyword(keywordInput);
      }
      if (e.key === "Backspace" && keywordInput === "" && keywords.length > 0) {
        removeKeyword(keywords.length - 1);
      }
    },
    [keywordInput, keywords, addKeyword, removeKeyword]
  );

  // SSE connection for article generation
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
                setGeneration({
                  phase: "success",
                  articleId,
                  seoScore: event.seo_score ?? null,
                  readabilityScore: event.readability_score ?? null,
                  wordCount: event.word_count ?? null,
                });
                // Fire confetti!
                fireConfetti();
                return;
              }

              if (event.status === "FAILED") {
                setGeneration({
                  phase: "error",
                  message:
                    event.error_message ??
                    "Article generation failed. Your credits have been automatically refunded.",
                });
                return;
              }

              setGeneration({ phase: "streaming", articleId, event });
            } catch {
              // skip invalid JSON
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setGeneration({
          phase: "error",
          message: "Lost connection to the server.",
        });
      });
  }, []);

  // Complete onboarding and save data
  async function completeOnboarding() {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone,
          point_of_view: pov,
          exemplar_content: exemplarContent || undefined,
          industry: industry || undefined,
          keywords: keywords.length > 0 ? keywords : undefined,
        }),
      });
    } catch (err) {
      console.error("[onboarding] Failed to save preferences:", err);
    }
  }

  // Generate first article
  async function handleGenerateArticle() {
    if (!articleKeyword.trim()) return;

    setGeneration({ phase: "submitting" });

    // First, complete onboarding to save brand voice
    await completeOnboarding();

    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: articleKeyword.trim(),
          length_preset: "medium",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setGeneration({
          phase: "error",
          message: data.error ?? "Failed to create article",
        });
        return;
      }

      const data = await res.json();
      connectSSE(data.article_id);
      setGeneration({
        phase: "streaming",
        articleId: data.article_id,
        event: { status: "QUEUED", message: "Preparing your article..." },
      });
    } catch {
      setGeneration({
        phase: "error",
        message: "Network error. Please try again.",
      });
    }
  }

  // Skip article generation and just complete onboarding
  async function handleSkipArticle() {
    await completeOnboarding();
    onComplete?.();
  }

  // Fire confetti animation
  function fireConfetti() {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }

  // Handle viewing the generated article
  function handleViewArticle() {
    if (generation.phase === "success") {
      onComplete?.();
      router.push(`/dashboard/articles/${generation.articleId}/edit`);
    }
  }

  // Navigation
  function nextStep() {
    if (step < 4) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  function goToStep(newStep: number) {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-lg overflow-hidden">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 border-b px-6 py-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                s === step
                  ? "bg-primary"
                  : s < step
                  ? "bg-primary/40"
                  : "bg-muted"
              )}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            Step {step} of 4
          </span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <IconSparkles className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">
                    Welcome{userName ? `, ${userName}` : ""}!
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Let&apos;s set up your SEO content factory in just a few steps.
                    You&apos;ll be generating optimized articles in no time.
                  </CardDescription>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium">Define your brand voice</p>
                      <p className="text-xs text-muted-foreground">
                        Set the tone and style for all your content
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium">Choose your content focus</p>
                      <p className="text-xs text-muted-foreground">
                        Tell us about your industry and target keywords
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium">Generate your first article</p>
                      <p className="text-xs text-muted-foreground">
                        Watch AI create SEO-optimized content in real-time
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="mt-8 w-full" size="lg" onClick={nextStep}>
                  Get Started
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Brand Voice */}
            {step === 2 && (
              <div className="p-6">
                <CardTitle>Set Your Brand Voice</CardTitle>
                <CardDescription className="mt-1">
                  Define how your content should sound. This will be applied to all
                  articles you generate.
                </CardDescription>

                <div className="mt-6 space-y-5">
                  {/* Tone selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tone</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONE_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "relative flex cursor-pointer flex-col rounded-lg border p-3 transition-colors hover:bg-accent/50",
                            tone === opt.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-input"
                          )}
                        >
                          <input
                            type="radio"
                            name="tone"
                            value={opt.value}
                            checked={tone === opt.value}
                            onChange={() => setTone(opt.value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold">{opt.value}</span>
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* POV selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Point of View</label>
                    <div className="grid grid-cols-3 gap-2">
                      {POV_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            "relative flex cursor-pointer flex-col rounded-lg border p-3 transition-colors hover:bg-accent/50",
                            pov === opt.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-input"
                          )}
                        >
                          <input
                            type="radio"
                            name="pov"
                            value={opt.value}
                            checked={pov === opt.value}
                            onChange={() => setPov(opt.value)}
                            className="sr-only"
                          />
                          <span className="text-sm font-semibold">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sample content (optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Sample Content{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      value={exemplarContent}
                      onChange={(e) => setExemplarContent(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="Paste a paragraph that represents your brand voice..."
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Helps AI match your unique writing style
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    Continue
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Content Focus */}
            {step === 3 && (
              <div className="p-6">
                <CardTitle>Content Focus</CardTitle>
                <CardDescription className="mt-1">
                  Help us understand your niche for better article suggestions.
                </CardDescription>

                <div className="mt-6 space-y-5">
                  {/* Industry select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                    >
                      <option value="">Select your industry...</option>
                      {INDUSTRY_OPTIONS.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Keywords tag input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Target Keywords{" "}
                      <span className="font-normal text-muted-foreground">
                        (3-5 recommended)
                      </span>
                    </label>
                    <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                      {keywords.map((kw, i) => (
                        <Badge
                          key={`${kw}-${i}`}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(i)}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        onBlur={() => {
                          if (keywordInput.trim()) addKeyword(keywordInput);
                        }}
                        disabled={keywords.length >= 5}
                        placeholder={
                          keywords.length === 0
                            ? 'Type a keyword and press Enter...'
                            : keywords.length >= 5
                            ? "Max 5 keywords"
                            : "Add more..."
                        }
                        className="min-w-[120px] flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Press Enter or comma to add. These help us suggest article
                      topics.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={nextStep}>
                    Continue
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Generate First Article */}
            {step === 4 && (
              <div className="p-6">
                {generation.phase === "idle" && (
                  <>
                    <CardTitle>Generate Your First Article</CardTitle>
                    <CardDescription className="mt-1">
                      Enter a keyword and watch AI create an SEO-optimized article.
                    </CardDescription>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Target Keyword
                        </label>
                        <input
                          type="text"
                          value={articleKeyword}
                          onChange={(e) => setArticleKeyword(e.target.value)}
                          placeholder="e.g. best project management tools 2025"
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        />
                      </div>

                      {keywords.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-muted-foreground">
                            Quick pick from your keywords:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((kw) => (
                              <Badge
                                key={kw}
                                variant="outline"
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => setArticleKeyword(kw)}
                              >
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" onClick={prevStep}>
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={!articleKeyword.trim()}
                        onClick={handleGenerateArticle}
                      >
                        Generate Article
                        <IconSparkles className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSkipArticle}
                      className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                      Skip for now, I&apos;ll generate later
                    </button>
                  </>
                )}

                {generation.phase === "submitting" && (
                  <div className="py-8 text-center">
                    <IconLoader className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Starting generation...
                    </p>
                  </div>
                )}

                {generation.phase === "streaming" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <CardTitle>Generating Article</CardTitle>
                      <CardDescription className="mt-1">
                        &quot;{articleKeyword}&quot;
                      </CardDescription>
                    </div>

                    <div className="space-y-2">
                      {STAGE_ORDER.map((stage, i) => {
                        const currentIdx = STAGE_ORDER.indexOf(
                          generation.event.status as (typeof STAGE_ORDER)[number]
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
                              <IconCheck className="h-4 w-4 shrink-0 text-green-500" />
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

                {generation.phase === "success" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <IconCheck className="h-8 w-8 text-green-500" />
                      </div>
                      <CardTitle className="text-2xl">Article Ready!</CardTitle>
                      <CardDescription className="mt-1">
                        Your first article has been generated successfully.
                      </CardDescription>
                    </div>

                    {/* Quality scores */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {generation.seoScore !== null && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-2xl font-bold text-primary">
                            {Math.round(generation.seoScore)}
                          </p>
                          <p className="text-xs text-muted-foreground">SEO Score</p>
                        </div>
                      )}
                      {generation.readabilityScore !== null && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-2xl font-bold text-primary">
                            {Math.round(generation.readabilityScore)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Readability
                          </p>
                        </div>
                      )}
                      {generation.wordCount !== null && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-2xl font-bold text-primary">
                            {generation.wordCount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Words</p>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" size="lg" onClick={handleViewArticle}>
                      View Your Article
                      <IconArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {generation.phase === "error" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <IconAlertTriangle className="h-8 w-8 text-destructive" />
                      </div>
                      <CardTitle>Generation Failed</CardTitle>
                      <CardDescription className="mt-1">
                        {generation.message}
                      </CardDescription>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleSkipArticle}
                      >
                        Skip for now
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setGeneration({ phase: "idle" })}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
