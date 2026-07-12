"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";

type Dash = {
  stats: {
    totalOrders: number;
    revenue: number;
    upcomingMatches: number;
    bulkPending: number;
    pendingOrders: number;
  };
  seatAvailability: { id: string; label: string; upperAvailable: number; closerAvailable: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    paymentAmount: number;
    paymentStatus: string;
    match: { homeTeam: { shortName: string }; awayTeam: { shortName: string } };
  }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Failed");
        setData(j);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!data) return <Spinner label="Loading dashboard..." />;

  return (
    <div className="space-y-8 page-enter">
      <div>
        <h1 className="font-display text-5xl">Dashboard</h1>
        <p className="text-[var(--ink-muted)]">Orders, revenue, fixtures, and seat health at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Orders" value={data.stats.totalOrders} />
        <StatCard label="Revenue" value={data.stats.revenue} />
        <StatCard label="Upcoming Matches" value={data.stats.upcomingMatches} />
        <StatCard label="Bulk Requests" value={data.stats.bulkPending} hint="Pending" />
        <StatCard label="Pending Orders" value={data.stats.pendingOrders} />
        <StatCard
          label="Seat Availability"
          value={data.seatAvailability.reduce((a, s) => a + s.upperAvailable + s.closerAvailable, 0)}
          hint="Open seats across upcoming matches"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-display text-3xl">Seat Availability</h2>
          <div className="mt-4 space-y-3">
            {data.seatAvailability.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>{s.label}</span>
                <span className="text-[var(--ink-muted)]">
                  Upper {s.upperAvailable} · Closer {s.closerAvailable}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-[var(--gold)]">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-[var(--ink-muted)]">
                    {o.customerName} · {o.match.homeTeam.shortName} vs {o.match.awayTeam.shortName}
                  </p>
                </div>
                <div className="text-right">
                  <p>{formatCurrency(o.paymentAmount)}</p>
                  <p className="text-[var(--ink-muted)]">{o.paymentStatus}</p>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">No orders yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
