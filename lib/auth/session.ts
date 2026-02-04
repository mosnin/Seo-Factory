import { auth, currentUser } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  const user = await currentUser();

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
}

export async function getAuthToken(): Promise<string | null> {
  const { getToken } = await auth();
  return getToken();
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}
