import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const transactions = await prisma.creditTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage your subscription and credit history.
      </p>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Credit Transactions
        </h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Description</th>
              <th className="pb-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="py-3 text-gray-600">
                  {formatDate(tx.createdAt)}
                </td>
                <td className="py-3">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                    {tx.type}
                  </span>
                </td>
                <td className="py-3 text-gray-600">
                  {tx.description ?? "—"}
                </td>
                <td className="py-3 text-right font-medium">
                  <span
                    className={
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
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
    </div>
  );
}
