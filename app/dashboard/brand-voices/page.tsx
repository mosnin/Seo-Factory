"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconLoader,
} from "@/components/ui/icons";
import { cn, formatDate } from "@/lib/utils";

/* ---------- Types ---------- */

interface BrandVoice {
  id: string;
  name: string;
  tone: string;
  point_of_view: string;
  exemplar_content: string | null;
  guidelines: string | null;
  forbidden_phrases: string | null;
  is_default: boolean;
  articles_count: number;
  created_at: string;
  updated_at: string;
}

/* ---------- Fetcher ---------- */

async function fetchBrandVoices(): Promise<BrandVoice[]> {
  const res = await fetch("/api/brand-voices");
  if (!res.ok) throw new Error("Failed to load brand voices");
  const data = await res.json();
  return data.brand_voices ?? [];
}

/* ---------- Delete Modal ---------- */

function DeleteModal({
  voice,
  onClose,
  onConfirm,
  isDeleting,
}: {
  voice: BrandVoice;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader>
          <CardTitle>Delete Brand Voice</CardTitle>
          <CardDescription>
            Are you sure you want to delete &ldquo;{voice.name}&rdquo;?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {voice.articles_count > 0 ? (
            <div className="rounded-md bg-warning/10 p-3">
              <p className="text-sm text-warning">
                This will affect{" "}
                <span className="font-bold">{voice.articles_count}</span>{" "}
                article{voice.articles_count !== 1 ? "s" : ""} using this voice.
                Those articles will no longer have a brand voice assigned.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This voice has no articles associated with it.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <IconLoader className="mr-2 h-4 w-4" /> Deleting...
              </>
            ) : (
              "Delete Voice"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ---------- Page ---------- */

export default function BrandVoicesPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<BrandVoice | null>(null);

  const { data: voices = [], isLoading } = useQuery({
    queryKey: ["brand-voices"],
    queryFn: fetchBrandVoices,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/brand-voices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-voices"] });
      setDeleteTarget(null);
    },
  });

  // Set default mutation
  const defaultMutation = useMutation({
    mutationFn: async ({
      id,
      isDefault,
    }: {
      id: string;
      isDefault: boolean;
    }) => {
      const res = await fetch(`/api/brand-voices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: isDefault }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-voices"] });
    },
  });

  const handleToggleDefault = useCallback(
    (voice: BrandVoice) => {
      defaultMutation.mutate({
        id: voice.id,
        isDefault: !voice.is_default,
      });
    },
    [defaultMutation]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Voices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure tone and style for your generated content.
          </p>
        </div>
        <a href="/dashboard/brand-voices/new">
          <Button>
            <IconPlus className="mr-2 h-4 w-4" />
            Create New Voice
          </Button>
        </a>
      </div>

      {voices.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No brand voices"
          description="Define a brand voice to ensure consistent tone across all your generated articles."
          actionLabel="Create Voice"
          actionHref="/dashboard/brand-voices/new"
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {voices.map((voice) => (
            <Card
              key={voice.id}
              className={cn(voice.is_default && "ring-2 ring-primary")}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{voice.name}</CardTitle>
                    <CardDescription>
                      POV: {voice.point_of_view}
                    </CardDescription>
                  </div>
                  {voice.is_default && (
                    <Badge variant="default" className="text-[10px]">
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {voice.tone.split(",").map((t) => (
                    <Badge key={t.trim()} variant="secondary">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
                {voice.forbidden_phrases && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Forbidden
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {voice.forbidden_phrases.split(",").map((p) => (
                        <Badge
                          key={p.trim()}
                          variant="destructive"
                          className="text-[10px]"
                        >
                          {p.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {voice.guidelines && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {voice.guidelines}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {voice.articles_count} article
                  {voice.articles_count !== 1 ? "s" : ""} &middot;{" "}
                  {formatDate(voice.created_at)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleDefault(voice)}
                    title={
                      voice.is_default
                        ? "Remove as default"
                        : "Set as default"
                    }
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent",
                      voice.is_default
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <IconCheck className="h-4 w-4" />
                  </button>
                  <a href={`/dashboard/brand-voices/${voice.id}/edit`}>
                    <button
                      title="Edit"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <IconPencil className="h-4 w-4" />
                    </button>
                  </a>
                  <button
                    onClick={() => setDeleteTarget(voice)}
                    title="Delete"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          voice={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
