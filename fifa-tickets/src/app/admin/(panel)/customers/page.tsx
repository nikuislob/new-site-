import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: { select: { totalAmount: true, paymentStatus: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Customers</h1>
      <p className="text-sm text-[var(--ink-muted)]">Purchaser profiles from checkout</p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Paid total</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const paidTotal = c.orders
                .filter((o) => o.paymentStatus === "PAID")
                .reduce((sum, o) => sum + o.totalAmount, 0);
              return (
                <tr key={c.id} className="border-b border-[var(--line)]/50">
                  <td className="px-4 py-3 font-semibold">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{c._count.orders}</td>
                  <td className="px-4 py-3">{formatMoney(paidTotal)}</td>
                  <td className="px-4 py-3">{c.createdAt.toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
