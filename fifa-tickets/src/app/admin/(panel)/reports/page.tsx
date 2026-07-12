import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const orders = await prisma.order.findMany({
    include: { match: true, category: true, customer: true },
  });

  const paid = orders.filter((o) => o.paymentStatus === "PAID");
  const pending = orders.filter((o) => o.paymentStatus === "PENDING");
  const revenue = paid.reduce((sum, o) => sum + o.totalAmount, 0);
  const tickets = paid.reduce((sum, o) => sum + o.quantity, 0);

  const byCategory = Object.values(
    paid.reduce<Record<string, { name: string; qty: number; revenue: number }>>((acc, o) => {
      const key = o.categoryId;
      if (!acc[key]) acc[key] = { name: o.category.name, qty: 0, revenue: 0 };
      acc[key].qty += o.quantity;
      acc[key].revenue += o.totalAmount;
      return acc;
    }, {})
  );

  const byMatch = Object.values(
    paid.reduce<Record<string, { name: string; qty: number; revenue: number }>>((acc, o) => {
      const key = o.matchId;
      if (!acc[key]) {
        acc[key] = {
          name: `${o.match.homeTeam} vs ${o.match.opponent}`,
          qty: 0,
          revenue: 0,
        };
      }
      acc[key].qty += o.quantity;
      acc[key].revenue += o.totalAmount;
      return acc;
    }, {})
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Sales Reports</h1>
          <p className="text-sm text-[var(--ink-muted)]">Revenue and ticket totals with CSV export</p>
        </div>
        <a href="/api/admin/reports?format=csv" className="btn btn-primary">
          Export CSV
        </a>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Paid revenue</p>
          <p className="mt-2 text-2xl font-bold">{formatMoney(revenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Tickets sold</p>
          <p className="mt-2 text-2xl font-bold">{tickets}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Paid orders</p>
          <p className="mt-2 text-2xl font-bold">{paid.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Pending payment</p>
          <p className="mt-2 text-2xl font-bold">{pending.length}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl tracking-[0.05em]">By category</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {byCategory.map((row) => (
              <li key={row.name} className="flex justify-between border-b border-[var(--line)]/60 py-2">
                <span>
                  {row.name} · {row.qty} tickets
                </span>
                <strong>{formatMoney(row.revenue)}</strong>
              </li>
            ))}
            {byCategory.length === 0 && <li className="text-[var(--ink-muted)]">No paid sales yet.</li>}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl tracking-[0.05em]">By match</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {byMatch.map((row) => (
              <li key={row.name} className="flex justify-between border-b border-[var(--line)]/60 py-2">
                <span>
                  {row.name} · {row.qty} tickets
                </span>
                <strong>{formatMoney(row.revenue)}</strong>
              </li>
            ))}
            {byMatch.length === 0 && <li className="text-[var(--ink-muted)]">No paid sales yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
