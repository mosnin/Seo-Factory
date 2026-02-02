import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const transactions = await prisma.creditTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and credit history.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Credit Transactions</CardTitle>
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">{tx.type}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
