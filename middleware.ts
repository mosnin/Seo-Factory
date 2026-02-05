import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/auth/signin(.*)",
  "/auth/signup(.*)",
  "/auth/reset-password(.*)",
  "/api/webhooks/(.*)",
  "/api/health",
]);

// Check if Clerk is configured
const isClerkConfigured = () => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return key && key !== "pk_test_dummy" && key.startsWith("pk_");
};

// Middleware that handles both configured and unconfigured Clerk states
export default function middleware(request: NextRequest) {
  // If Clerk is not configured, allow all requests (demo mode)
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }

  // Clerk is configured - use Clerk middleware
  return clerkMiddleware((auth, req) => {
    if (!isPublicRoute(req)) {
      auth().protect();
    }
  })(request, {} as never);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
