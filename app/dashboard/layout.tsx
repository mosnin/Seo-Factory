import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In production, fetch the user from the session/database.
  // Hardcoded here for the shell — will be wired to Cognito session later.
  const user = {
    name: "Test User",
    email: "test@seofactory.dev",
    credits: 150,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar
        userName={user.name}
        userEmail={user.email}
        credits={user.credits}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
