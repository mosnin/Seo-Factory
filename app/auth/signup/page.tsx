"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Check if Clerk is configured
const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return key && key !== "pk_test_dummy" && key.startsWith("pk_");
};

function DemoModeNotice() {
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Demo Mode
        </h2>
        <p className="mt-2 text-gray-600">
          Authentication is not configured. This is a demo preview of the
          application.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          To enable authentication, configure Clerk environment variables in
          your deployment settings.
        </p>
        <div className="mt-6 space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full">Continue to Dashboard</Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ClerkSignUp() {
  // Dynamically import to avoid issues when Clerk is not configured
  const { SignUp } = require("@clerk/nextjs");

  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-sm border bg-white",
        },
      }}
      fallbackRedirectUrl="/dashboard"
      signInUrl="/auth/signin"
    />
  );
}

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <DemoModeNotice />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <ClerkSignUp />
    </div>
  );
}
