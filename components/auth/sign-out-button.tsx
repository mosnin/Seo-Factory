"use client";

import { useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/signin");
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 w-full text-left"
    >
      Sign out
    </button>
  );
}
