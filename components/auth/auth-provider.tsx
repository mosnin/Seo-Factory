"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-brand-600 hover:bg-brand-500 text-sm font-semibold",
          card: "shadow-sm border",
          formFieldInput:
            "rounded-md border-gray-300 focus:border-brand-500 focus:ring-brand-500",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
