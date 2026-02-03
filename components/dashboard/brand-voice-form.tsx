"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { IconChevronLeft, IconLoader, IconX } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/* ---------- Constants ---------- */

const TONE_OPTIONS = [
  "Professional",
  "Conversational",
  "Technical",
  "Authoritative",
] as const;

const POV_OPTIONS = [
  { value: "We/Us", label: "We/Us", description: "First person plural" },
  { value: "You", label: "You", description: "Second person" },
  {
    value: "Third Person",
    label: "Third Person",
    description: "He/She/They/The company",
  },
] as const;

/* ---------- Types ---------- */

export interface BrandVoiceFormData {
  name: string;
  tone: string;
  point_of_view: string;
  guidelines: string;
  exemplar_content: string;
  forbidden_phrases: string;
  is_default: boolean;
}

interface BrandVoiceFormProps {
  mode: "create" | "edit";
  initialData?: Partial<BrandVoiceFormData>;
  voiceId?: string;
}

/* ---------- Component ---------- */

export function BrandVoiceForm({
  mode,
  initialData,
  voiceId,
}: BrandVoiceFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [tone, setTone] = useState(initialData?.tone ?? "Professional");
  const [pov, setPov] = useState(initialData?.point_of_view ?? "We/Us");
  const [guidelines, setGuidelines] = useState(
    initialData?.guidelines ?? ""
  );
  const [exemplarContent, setExemplarContent] = useState(
    initialData?.exemplar_content ?? ""
  );
  const [forbiddenPhrases, setForbiddenPhrases] = useState<string[]>(
    initialData?.forbidden_phrases
      ? initialData.forbidden_phrases
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : []
  );
  const [tagInput, setTagInput] = useState("");
  const [isDefault, setIsDefault] = useState(
    initialData?.is_default ?? false
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tag input handlers
  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed && !forbiddenPhrases.includes(trimmed)) {
        setForbiddenPhrases((prev) => [...prev, trimmed]);
      }
      setTagInput("");
    },
    [forbiddenPhrases]
  );

  const removeTag = useCallback((index: number) => {
    setForbiddenPhrases((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput);
      }
      if (
        e.key === "Backspace" &&
        tagInput === "" &&
        forbiddenPhrases.length > 0
      ) {
        removeTag(forbiddenPhrases.length - 1);
      }
    },
    [tagInput, forbiddenPhrases, addTag, removeTag]
  );

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const payload: BrandVoiceFormData = {
      name: name.trim(),
      tone,
      point_of_view: pov,
      guidelines: guidelines.trim(),
      exemplar_content: exemplarContent.trim(),
      forbidden_phrases: forbiddenPhrases.join(", "),
      is_default: isDefault,
    };

    try {
      const url =
        mode === "create"
          ? "/api/brand-voices"
          : `/api/brand-voices/${voiceId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      router.push("/dashboard/brand-voices");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <a href="/dashboard/brand-voices">
          <Button variant="ghost" size="icon">
            <IconChevronLeft className="h-5 w-5" />
          </Button>
        </a>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Create Brand Voice" : "Edit Brand Voice"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "create"
              ? "Define a new tone and style for your content."
              : "Update your brand voice settings."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Corporate Blog", "Friendly Newsletter"'
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
        </div>

        {/* Tone select */}
        <div className="space-y-2">
          <label htmlFor="tone" className="text-sm font-medium">
            Tone <span className="text-destructive">*</span>
          </label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* POV radio buttons */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Point of View <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {POV_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors hover:bg-accent/50",
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
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {opt.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tone description / guidelines */}
        <div className="space-y-2">
          <label htmlFor="guidelines" className="text-sm font-medium">
            Tone Description{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            id="guidelines"
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Describe nuances of the tone. E.g. 'Confident but not arrogant. Use data to back claims. Prefer short sentences.'"
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <p className="text-[10px] text-muted-foreground">
            Helps Claude understand the nuances of your desired tone.
          </p>
        </div>

        {/* Forbidden phrases tag input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Forbidden Phrases{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
            {forbiddenPhrases.map((phrase, i) => (
              <Badge
                key={`${phrase}-${i}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                {phrase}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/20"
                >
                  <IconX className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (tagInput.trim()) addTag(tagInput);
              }}
              placeholder={
                forbiddenPhrases.length === 0
                  ? 'Type a phrase and press Enter (e.g. "synergy")'
                  : "Add more..."
              }
              className="min-w-[120px] flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Press Enter or comma to add. These words will be avoided in
            generated content.
          </p>
        </div>

        {/* Exemplar content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Exemplar Content</CardTitle>
            <CardDescription>
              Paste 2-3 paragraphs in your brand voice. This is optional but
              significantly improves consistency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={exemplarContent}
              onChange={(e) => setExemplarContent(e.target.value)}
              rows={6}
              maxLength={5000}
              placeholder="Paste example content that represents your brand voice well..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {exemplarContent.length > 0
                  ? "Embedding will be generated on save for similarity matching."
                  : ""}
              </span>
              <span>{exemplarContent.length}/5000</span>
            </div>
          </CardContent>
        </Card>

        {/* Set as default toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isDefault}
            onClick={() => setIsDefault(!isDefault)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
              isDefault ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                isDefault ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <div>
            <span className="text-sm font-medium">Set as default voice</span>
            <p className="text-xs text-muted-foreground">
              New articles will use this voice unless changed.
            </p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <IconLoader className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create Voice"
            ) : (
              "Save Changes"
            )}
          </Button>
          <a href="/dashboard/brand-voices">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </a>
        </div>
      </form>
    </div>
  );
}
