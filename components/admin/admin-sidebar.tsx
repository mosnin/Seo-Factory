"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import {
  IconLayoutDashboard,
  IconUsers,
  IconFileText,
  IconBarChart,
  IconChevronLeft,
} from "@/components/ui/icons";

const navItems = [
  { label: "Overview", href: "/admin", icon: <IconLayoutDashboard className="h-4 w-4" /> },
  { label: "Users", href: "/admin/users", icon: <IconUsers className="h-4 w-4" /> },
  { label: "Articles", href: "/admin/articles", icon: <IconFileText className="h-4 w-4" /> },
  { label: "Analytics", href: "/admin/analytics", icon: <IconBarChart className="h-4 w-4" /> },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-sm font-bold text-destructive-foreground">
            A
          </div>
          <span className="text-base font-semibold text-sidebar-foreground">
            Admin Panel
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <ThemeToggle />
          </div>
          <a
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <IconChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </a>
        </div>
      </div>
    </aside>
  );
}
