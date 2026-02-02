import {
  fetchAuthSession,
  getCurrentUser as amplifyGetCurrentUser,
} from "aws-amplify/auth";

export async function getCurrentUser() {
  try {
    const user = await amplifyGetCurrentUser();
    return {
      userId: user.userId,
      username: user.username,
    };
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}
