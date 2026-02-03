import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/** Server-side check: returns the first user (dev placeholder) or null if not admin. */
export async function requireAdmin() {
  const user = await prisma.user.findFirst();
  if (!user || !isAdminEmail(user.email)) {
    return null;
  }
  return user;
}
