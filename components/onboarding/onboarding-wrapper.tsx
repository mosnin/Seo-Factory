"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { OnboardingModal } from "./onboarding-modal";

interface OnboardingStatus {
  user_id: string;
  name: string | null;
  onboarding_completed: boolean;
  credits_balance: number;
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus | null> {
  const res = await fetch("/api/onboarding");
  if (!res.ok) return null;
  return res.json();
}

export function OnboardingWrapper() {
  const [showModal, setShowModal] = useState(false);

  const { data: status, refetch } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: fetchOnboardingStatus,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Show modal only when we've fetched status and onboarding is not completed
    if (status && !status.onboarding_completed) {
      setShowModal(true);
    }
  }, [status]);

  function handleComplete() {
    setShowModal(false);
    // Refetch to update the status
    refetch();
  }

  if (!showModal) return null;

  return (
    <OnboardingModal
      userName={status?.name || undefined}
      onComplete={handleComplete}
    />
  );
}
