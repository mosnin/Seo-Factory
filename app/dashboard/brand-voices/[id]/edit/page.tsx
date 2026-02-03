"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BrandVoiceForm,
  type BrandVoiceFormData,
} from "@/components/dashboard/brand-voice-form";

interface BrandVoiceResponse {
  id: string;
  name: string;
  tone: string;
  point_of_view: string;
  guidelines: string | null;
  exemplar_content: string | null;
  forbidden_phrases: string | null;
  is_default: boolean;
}

export default function EditBrandVoicePage() {
  const params = useParams();
  const voiceId = params.id as string;

  const { data, isLoading, error } = useQuery<BrandVoiceResponse>({
    queryKey: ["brand-voice", voiceId],
    queryFn: async () => {
      const res = await fetch(`/api/brand-voices/${voiceId}`);
      if (!res.ok) throw new Error("Failed to load brand voice");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded bg-muted" />
          <div>
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-8 max-w-2xl space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Brand voice not found</p>
          <a
            href="/dashboard/brand-voices"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Back to brand voices
          </a>
        </div>
      </div>
    );
  }

  const initialData: Partial<BrandVoiceFormData> = {
    name: data.name,
    tone: data.tone,
    point_of_view: data.point_of_view,
    guidelines: data.guidelines ?? "",
    exemplar_content: data.exemplar_content ?? "",
    forbidden_phrases: data.forbidden_phrases ?? "",
    is_default: data.is_default,
  };

  return (
    <BrandVoiceForm mode="edit" initialData={initialData} voiceId={voiceId} />
  );
}
