"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data?.stats) {
    return <div className="skeleton h-40 w-full" />;
  }

  const s = data.stats;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">Dashboard</h1>
        <p className="text-sm text-white/50">Live box-office overview</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders" value={String(s.totalOrders)} />
        <StatCard label="Paid Orders" value={String(s.paidOrders)} />
        <StatCard label="Pending Orders" value={String(s.pendingOrders)} />
        <StatCard label="Tickets Sold" value={String(s.ticketsSold)} />
        <StatCard label="Remaining Inventory" value={String(s.remainingInventory)} />
        <StatCard label="Revenue" value={formatCurrency(s.revenueCents)} />
        <StatCard label="Active Chats" value={String(s.activeChats)} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[var(--brand)]">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-white/45">
              <tr>
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders?.map((o: any) => (
                <tr key={o.id} className="border-t border-white/5">
                  <td className="px-2 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="text-[var(--brand)]">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-2 py-2">{o.customerName}</td>
                  <td className="px-2 py-2">{o.status}</td>
                  <td className="px-2 py-2">{formatCurrency(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
