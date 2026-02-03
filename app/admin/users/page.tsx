"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  IconUsers,
  IconTrendingUp,
  IconMoreVertical,
  IconSearch,
  IconCoins,
  IconEye,
  IconBan,
  IconChevronLeft,
  IconLoader,
} from "@/components/ui/icons";
import { cn, formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  planTier: string;
  creditsBalance: number;
  articlesCount: number;
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
}

const PLAN_TIERS = ["ALL", "FREE", "STARTER", "PRO", "ENTERPRISE"];
const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "churned", label: "Churned" },
];

const planColors: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  FREE: "secondary",
  STARTER: "default",
  PRO: "success",
  ENTERPRISE: "warning",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("ALL");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Modals
  const [creditsModal, setCreditsModal] = useState<{ userId: string; email: string } | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [planModal, setPlanModal] = useState<{ userId: string; email: string; current: string } | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (plan && plan !== "ALL") params.set("plan", plan);
    if (status) params.set("status", status);
    params.set("page", String(page));
    return params.toString();
  }, [search, plan, status, page]);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["admin-users", search, plan, status, page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?${buildParams()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    staleTime: 30_000,
  });

  const actionMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreditsModal(null);
      setCreditsAmount("");
      setPlanModal(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage all users, credits, and subscriptions.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data?.total ?? 0}
          icon={<IconUsers className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Users (30d)"
          value="-"
          icon={<IconTrendingUp className="h-4 w-4 text-muted-foreground" />}
          subtitle="Generated article in last 30 days"
        />
        <MetricCard
          title="MRR"
          value="-"
          icon={<IconCoins className="h-4 w-4 text-muted-foreground" />}
          subtitle="Monthly recurring revenue"
        />
        <MetricCard
          title="Churn Rate"
          value="-"
          icon={<IconTrendingUp className="h-4 w-4 text-muted-foreground" />}
          subtitle="Last 30 days"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {PLAN_TIERS.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "All Plans" : t}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Credits</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Articles</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <IconLoader className="mx-auto h-5 w-5" />
                    </td>
                  </tr>
                ) : !data?.users.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  data.users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          {user.name && (
                            <p className="text-xs text-muted-foreground">{user.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={planColors[user.planTier] ?? "outline"}>
                          {user.planTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {user.creditsBalance}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {user.articlesCount}
                      </td>
                      <td className="px-4 py-3">
                        {user.hasSubscription ? (
                          user.cancelAtPeriodEnd ? (
                            <Badge variant="warning">Canceling</Badge>
                          ) : (
                            <Badge variant="success">Active</Badge>
                          )
                        ) : user.planTier === "FREE" ? (
                          <Badge variant="secondary">Free</Badge>
                        ) : (
                          <Badge variant="destructive">Churned</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                            <IconMoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/dashboard?impersonate=${user.id}`, "_blank")
                              }
                            >
                              <IconEye className="mr-2 h-3.5 w-3.5" />
                              View as User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setCreditsModal({ userId: user.id, email: user.email })
                              }
                            >
                              <IconCoins className="mr-2 h-3.5 w-3.5" />
                              Add Credits
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setPlanModal({
                                  userId: user.id,
                                  email: user.email,
                                  current: user.planTier,
                                })
                              }
                            >
                              <IconTrendingUp className="mr-2 h-3.5 w-3.5" />
                              Change Plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              destructive
                              onClick={() => {
                                if (confirm(`Suspend ${user.email}? This will remove their subscription and credits.`)) {
                                  actionMutation.mutate({
                                    action: "suspend",
                                    userId: user.id,
                                  });
                                }
                              }}
                            >
                              <IconBan className="mr-2 h-3.5 w-3.5" />
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.total ?? 0} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Credits Modal */}
      {creditsModal && (
        <ModalOverlay onClose={() => setCreditsModal(null)}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Add Credits</h2>
            <p className="text-sm text-muted-foreground">
              Grant bonus credits to <strong>{creditsModal.email}</strong>
            </p>
            <input
              type="number"
              min={1}
              placeholder="Number of credits"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreditsModal(null)}>
                Cancel
              </Button>
              <Button
                disabled={!creditsAmount || actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    action: "add_credits",
                    userId: creditsModal.userId,
                    amount: parseInt(creditsAmount, 10),
                  })
                }
              >
                {actionMutation.isPending ? "Adding..." : "Add Credits"}
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Change Plan Modal */}
      {planModal && (
        <ModalOverlay onClose={() => setPlanModal(null)}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Change Plan</h2>
            <p className="text-sm text-muted-foreground">
              Change plan for <strong>{planModal.email}</strong> (current:{" "}
              {planModal.current})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["FREE", "STARTER", "PRO", "ENTERPRISE"].map((tier) => (
                <Button
                  key={tier}
                  variant={tier === planModal.current ? "default" : "outline"}
                  disabled={tier === planModal.current || actionMutation.isPending}
                  onClick={() =>
                    actionMutation.mutate({
                      action: "change_plan",
                      userId: planModal.userId,
                      planTier: tier,
                    })
                  }
                >
                  {tier}
                </Button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPlanModal(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
