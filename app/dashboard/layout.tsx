import { SignOutButton } from "@/components/auth/sign-out-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-gray-50 p-6">
        <div className="text-lg font-bold text-gray-900">SEO Factory</div>
        <nav className="mt-8 flex flex-1 flex-col gap-2">
          <a
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Overview
          </a>
          <a
            href="/dashboard/articles"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Articles
          </a>
          <a
            href="/dashboard/brand-voices"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Brand Voices
          </a>
          <a
            href="/dashboard/billing"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Billing
          </a>
          <div className="mt-auto border-t pt-4">
            <SignOutButton />
          </div>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
