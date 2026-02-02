"use client";

import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { amplifyConfig } from "@/lib/auth/amplify-config";

let amplifyConfigured = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(amplifyConfigured);

  useEffect(() => {
    if (!amplifyConfigured) {
      Amplify.configure(amplifyConfig, { ssr: true });
      amplifyConfigured = true;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
