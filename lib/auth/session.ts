import { prisma } from "@/lib/prisma";

// Dynamically import Clerk to avoid build-time issues with invalid keys
async function getClerkAuth() {
  const { auth } = await import("@clerk/nextjs/server");
  return auth();
}

async function getClerkUser() {
  const { currentUser } = await import("@clerk/nextjs/server");
  return currentUser();
}

export async function getCurrentUser() {
  try {
    const user = await getClerkUser();

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? null,
      name: user.firstName
        ? `${user.firstName} ${user.lastName ?? ""}`.trim()
        : null,
      imageUrl: user.imageUrl,
    };
  } catch {
    // Return null during build or if Clerk is not configured
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const { getToken } = await getClerkAuth();
    return getToken();
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const { userId } = await getClerkAuth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

/**
 * Get the database user for the currently authenticated Clerk user.
 * Creates the user if they don't exist (first-time sign-in).
 */
export async function getDbUser() {
  try {
    const { userId } = await getClerkAuth();

    if (!userId) {
      return null;
    }

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // If user doesn't exist, create them (first sign-in)
    if (!user) {
      const clerkUser = await getClerkUser();
      if (!clerkUser) return null;

      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) return null;

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
            : null,
          creditsBalance: 10, // Free credits for new users
        },
      });
    }

    return user;
  } catch {
    // Return null during build or if Clerk is not configured
    return null;
  }
}

/**
 * Require database user - throws if not authenticated or user doesn't exist
 */
export async function requireDbUser() {
  const user = await getDbUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
