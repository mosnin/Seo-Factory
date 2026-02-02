"use client";

import { cn } from "@/lib/utils";

/* ---------- Score Ring ---------- */

function ScoreRing({
  score,
  label,
  max = 100,
}: {
  score: number | null;
  label: string;
  max?: number;
}) {
  const pct = score !== null ? Math.min((score / max) * 100, 100) : 0;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color =
    pct >= 80
      ? "text-success"
      : pct >= 50
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("transition-all duration-700", color)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">
            {score !== null ? Math.round(score) : "--"}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

/* ---------- Density Bar ---------- */

function DensityBar({
  label,
  value,
  ideal,
}: {
  label: string;
  value: number;
  ideal: [number, number];
}) {
  const pct = Math.min(value * 100, 5);
  const barWidth = (pct / 5) * 100;
  const inRange = value >= ideal[0] && value <= ideal[1];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className={cn("font-medium", inRange ? "text-success" : "text-warning")}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            inRange ? "bg-success" : "bg-warning"
          )}
          style={{ width: `${Math.max(barWidth, 2)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Ideal: {ideal[0] * 100}% - {ideal[1] * 100}%
      </p>
    </div>
  );
}

/* ---------- EEAT Breakdown ---------- */

function EeatBreakdown({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <p className="text-xs text-muted-foreground">
        E-E-A-T score not yet available.
      </p>
    );
  }

  // Approximate breakdown from overall score
  const experience = Math.min(score * 0.9, 10);
  const expertise = Math.min(score * 1.05, 10);
  const authority = Math.min(score * 0.85, 10);
  const trust = Math.min(score * 1.1, 10);

  const factors = [
    { label: "Experience", value: experience },
    { label: "Expertise", value: expertise },
    { label: "Authoritativeness", value: authority },
    { label: "Trustworthiness", value: trust },
  ];

  return (
    <div className="space-y-2">
      {factors.map((f) => (
        <div key={f.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>{f.label}</span>
            <span className="font-medium">{f.value.toFixed(1)}/10</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                f.value >= 7
                  ? "bg-success"
                  : f.value >= 4
                    ? "bg-warning"
                    : "bg-destructive"
              )}
              style={{ width: `${(f.value / 10) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Readability Grade ---------- */

function readabilityGrade(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 90) return "5th Grade";
  if (score >= 80) return "6th Grade";
  if (score >= 70) return "7th Grade";
  if (score >= 60) return "8th-9th Grade";
  if (score >= 50) return "10th-12th Grade";
  if (score >= 30) return "College";
  return "Graduate";
}

/* ---------- Main Component ---------- */

interface AnalyticsTabProps {
  seoScore: number | null;
  readabilityScore: number | null;
  eeatScore: number | null;
  keywordDensity: number | null;
  wordCount: number | null;
  targetLength: number;
  keyword: string;
}

export function AnalyticsTab({
  seoScore,
  readabilityScore,
  eeatScore,
  keywordDensity,
  wordCount,
  targetLength,
  keyword,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Score rings */}
      <div className="flex items-center justify-around">
        <ScoreRing score={seoScore} label="SEO" />
        <ScoreRing score={readabilityScore} label="Readability" />
        <ScoreRing score={eeatScore} label="E-E-A-T" max={10} />
      </div>

      {/* Word count progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span>Word Count</span>
          <span className="font-medium">
            {wordCount?.toLocaleString() ?? 0} / {targetLength.toLocaleString()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${Math.min(((wordCount ?? 0) / targetLength) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Keyword density */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Keyword Density
        </h4>
        <DensityBar
          label={`"${keyword}"`}
          value={keywordDensity ?? 0}
          ideal={[0.01, 0.03]}
        />
      </div>

      {/* Readability */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Readability
        </h4>
        <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
          <span className="text-sm">Flesch-Kincaid</span>
          <div className="text-right">
            <span className="text-lg font-bold">
              {readabilityScore !== null ? Math.round(readabilityScore) : "--"}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {readabilityGrade(readabilityScore)}
            </p>
          </div>
        </div>
      </div>

      {/* EEAT */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          E-E-A-T Breakdown
        </h4>
        <EeatBreakdown score={eeatScore} />
      </div>
    </div>
  );
}
