import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [matches, orders, customers, inquiries, seatsAvailable, seatsSold, revenueAgg, recentOrders] =
    await Promise.all([
      prisma.match.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.contactInquiry.count({ where: { status: "NEW" } }),
      prisma.seat.count({ where: { status: "AVAILABLE" } }),
      prisma.seat.count({ where: { status: "SOLD" } }),
      prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { customer: true, match: true, category: true },
      }),
    ]);

  const stats = [
    { label: "Matches", value: String(matches) },
    { label: "Orders", value: String(orders) },
    { label: "Customers", value: String(customers) },
    { label: "Paid revenue", value: formatMoney(revenueAgg._sum.totalAmount || 0) },
    { label: "Seats available", value: String(seatsAvailable) },
    { label: "Seats sold", value: String(seatsSold) },
    { label: "New bulk inquiries", value: String(inquiries) },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Dashboard</h1>
      <p className="mt-1 text-[var(--ink-muted)]">FIFA ticket operations overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--pitch-deep)]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-[0.05em]">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-[var(--pitch)]">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
              <tr>
                <th className="py-2 font-semibold">Order</th>
                <th className="py-2 font-semibold">Customer</th>
                <th className="py-2 font-semibold">Match</th>
                <th className="py-2 font-semibold">Total</th>
                <th className="py-2 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-[var(--line)]/60">
                  <td className="py-3 font-medium">{o.orderNumber}</td>
                  <td className="py-3">
                    {o.customer.firstName} {o.customer.lastName}
                  </td>
                  <td className="py-3">
                    {o.match.homeTeam} vs {o.match.opponent}
                  </td>
                  <td className="py-3">{formatMoney(o.totalAmount)}</td>
                  <td className="py-3">
                    <span
                      className={`badge ${
                        o.paymentStatus === "PAID"
                          ? "bg-[var(--pitch-soft)] text-[var(--pitch)]"
                          : "bg-[#fff4e5] text-[#8a4b08]"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
