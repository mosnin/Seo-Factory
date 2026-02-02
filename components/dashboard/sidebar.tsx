"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreditBadge } from "@/components/dashboard/credit-badge";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import {
  IconMenu,
  IconX,
  IconLayoutDashboard,
  IconFileText,
  IconMic,
  IconCreditCard,
  IconLogOut,
} from "@/components/ui/icons";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <IconLayoutDashboard className="h-4 w-4" /> },
  { label: "Articles", href: "/dashboard/articles", icon: <IconFileText className="h-4 w-4" /> },
  { label: "Brand Voices", href: "/dashboard/brand-voices", icon: <IconMic className="h-4 w-4" /> },
  { label: "Billing", href: "/dashboard/billing", icon: <IconCreditCard className="h-4 w-4" /> },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  credits?: number;
}

function SidebarNav({ userName, userEmail, credits = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/signin");
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          S
        </div>
        <span className="text-base font-semibold text-sidebar-foreground">
          SEO Factory
        </span>
      </div>

      {/* Credits */}
      <div className="px-3 py-2">
        <CreditBadge credits={credits} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer: user profile + theme + sign out */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            {userName && (
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
            )}
            {userEmail && (
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <IconLogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar (sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent onClose={() => setMobileOpen(false)}>
          <div className="absolute right-3 top-3">
            <button
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Close menu"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <SidebarNav {...props} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-sidebar-border lg:bg-sidebar">
        <SidebarNav {...props} />
      </aside>
    </>
  );
}
