"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { IconCheck, IconLoader, IconCoins } from "@/components/ui/icons";
import { cn, formatDate } from "@/lib/utils";
import { PLANS, CREDIT_PACKS, type PlanKey } from "@/lib/constants";

/* ---------- Types ---------- */

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string | null;
  balance_after: number;
}

interface BillingData {
  plan_tier: string;
  credits_balance: number;
  subscription: {
    stripe_subscription_id: string;
    stripe_price_id: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  transactions: Transaction[];
}

/* ---------- Fetcher ---------- */

async function fetchBilling(): Promise<BillingData> {
  const res = await fetch("/api/billing");
  if (!res.ok) throw new Error("Failed to load billing data");
  return res.json();
}

/* ---------- Success banner ---------- */

function SuccessBanner() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;
  return (
    <div className="mb-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
      <p className="text-sm font-medium text-success">
        Payment successful! Your credits have been added.
      </p>
    </div>
  );
}

/* ---------- Current Plan Card ---------- */

function CurrentPlanCard({
  planTier,
  creditsBalance,
  subscription,
  onManage,
  isManaging,
}: {
  planTier: string;
  creditsBalance: number;
  subscription: BillingData["subscription"];
  onManage: () => void;
  isManaging: boolean;
}) {
  const plan = PLANS[planTier as PlanKey] ?? PLANS.FREE;
  const renewalDate = subscription?.current_period_end
    ? formatDate(subscription.current_period_end)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{plan.name} Plan</CardTitle>
            <CardDescription>
              {plan.price > 0 ? `$${plan.price}/month` : "Free forever"}
            </CardDescription>
          </div>
          <Badge
            variant={planTier === "FREE" ? "secondary" : "default"}
            className="text-xs"
          >
            Current Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary/50 px-4 py-3">
            <p className="text-2xl font-bold">{creditsBalance}</p>
            <p className="text-xs text-muted-foreground">Credits remaining</p>
          </div>
          <div className="rounded-lg bg-secondary/50 px-4 py-3">
            <p className="text-2xl font-bold">{plan.credits}</p>
            <p className="text-xs text-muted-foreground">Credits/month</p>
          </div>
        </div>
        {renewalDate && (
          <p className="mt-3 text-xs text-muted-foreground">
            {subscription?.cancel_at_period_end
              ? `Cancels on ${renewalDate}`
              : `Renews on ${renewalDate}`}
          </p>
        )}
      </CardContent>
      {subscription && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            disabled={isManaging}
          >
            {isManaging ? (
              <>
                <IconLoader className="mr-2 h-4 w-4" />
                Loading...
              </>
            ) : (
              "Manage Subscription"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

/* ---------- Plan Cards ---------- */

function PlanCards({
  currentPlan,
  onSubscribe,
  loadingPlan,
}: {
  currentPlan: string;
  onSubscribe: (key: string) => void;
  loadingPlan: string | null;
}) {
  const planEntries = Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][];

  return (
    <div>
      <h2 className="text-lg font-semibold">
        {currentPlan === "FREE" ? "Choose a Plan" : "Change Plan"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upgrade to unlock more credits and features.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {planEntries.map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const isPopular = key === "PRO";

          return (
            <Card
              key={key}
              className={cn(
                "relative",
                isPopular && "ring-2 ring-primary",
                isCurrent && "bg-secondary/30"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="text-[10px]">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrent ? (
                  <Button className="w-full" variant="secondary" disabled>
                    Current Plan
                  </Button>
                ) : key === "FREE" ? (
                  <Button className="w-full" variant="outline" disabled>
                    Free Tier
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => onSubscribe(key)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === key ? (
                      <>
                        <IconLoader className="mr-2 h-4 w-4" />
                        Redirecting...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Credit Packs ---------- */

function CreditPacks({
  onBuy,
  loadingPack,
}: {
  onBuy: (index: number) => void;
  loadingPack: number | null;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Buy Credits</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Purchase additional credits without changing your plan.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDIT_PACKS.map((pack, i) => (
          <Card key={pack.credits}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <IconCoins className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold">{pack.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {pack.priceLabel}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => onBuy(i)}
                disabled={loadingPack !== null}
              >
                {loadingPack === i ? (
                  <>
                    <IconLoader className="mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  `Buy ${pack.priceLabel}`
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Transaction History ---------- */

function TransactionHistory({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transactions yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 text-right font-medium">Amount</th>
                <th className="pb-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-3 text-muted-foreground">
                    {formatDate(tx.date)}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        tx.type === "PURCHASE"
                          ? "success"
                          : tx.type === "REFUND"
                            ? "warning"
                            : tx.type === "BONUS"
                              ? "default"
                              : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {tx.type}
                    </Badge>
                  </td>
                  <td className="max-w-[200px] truncate py-3 text-muted-foreground">
                    {tx.description ?? "\u2014"}
                  </td>
                  <td className="py-3 text-right font-medium">
                    <span
                      className={
                        tx.amount > 0
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {tx.balance_after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Skeleton ---------- */

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-48 animate-pulse rounded-lg border bg-muted" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-lg border bg-muted" />
    </div>
  );
}

/* ---------- Page ---------- */

export default function BillingPage() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams.get("success") === "true";

  const { data, isLoading } = useQuery({
    queryKey: ["billing"],
    queryFn: fetchBilling,
  });

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<number | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  async function handleCheckout(priceKey: string) {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_key: priceKey }),
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      // Reset loading states on error
      setLoadingPlan(null);
      setLoadingPack(null);
    }
  }

  function handleSubscribe(planKey: string) {
    setLoadingPlan(planKey);
    handleCheckout(planKey);
  }

  function handleBuyCredits(index: number) {
    setLoadingPack(index);
    const priceKey = index === 0 ? "CREDIT_50" : "CREDIT_100";
    handleCheckout(priceKey);
  }

  async function handleManageSubscription() {
    setIsManaging(true);
    try {
      const res = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setIsManaging(false);
    }
  }

  if (isLoading) return <BillingSkeleton />;

  const billing = data!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription, purchase credits, and view transaction
          history.
        </p>
      </div>

      {showSuccess && <SuccessBanner />}

      {/* Current plan */}
      <CurrentPlanCard
        planTier={billing.plan_tier}
        creditsBalance={billing.credits_balance}
        subscription={billing.subscription}
        onManage={handleManageSubscription}
        isManaging={isManaging}
      />

      {/* Plan cards */}
      <PlanCards
        currentPlan={billing.plan_tier}
        onSubscribe={handleSubscribe}
        loadingPlan={loadingPlan}
      />

      {/* Credit packs */}
      <CreditPacks onBuy={handleBuyCredits} loadingPack={loadingPack} />

      {/* Transaction history */}
      <TransactionHistory transactions={billing.transactions} />
    </div>
  );
}
