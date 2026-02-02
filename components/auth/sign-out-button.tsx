"use client";

import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { IconLogOut } from "@/components/ui/icons";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/signin");
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <IconLogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
