import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In production, get the user from the session. Hardcoded for dev shell.
  const user = await prisma.user.findFirst();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
