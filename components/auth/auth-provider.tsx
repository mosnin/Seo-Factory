"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Check if Clerk is configured - if not, render children without auth wrapper
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey || publishableKey === "pk_test_dummy") {
    // Clerk not configured - render without auth provider
    // This allows the app to run for demo/preview purposes
    return <>{children}</>;
  }

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
