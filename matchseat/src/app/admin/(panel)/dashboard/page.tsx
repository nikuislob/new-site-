"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, MessageSquare, ReceiptText } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminOrder } from "@/components/admin/types";
import { Spinner } from "@/components/ui/Spinner";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";

type DashboardData = {
  counts: {
    matches: number;
    pendingOrders: number;
    confirmedRevenueCents: number;
    openChats: number;
  };
};

const columns: DataTableColumn<AdminOrder>[] = [
  {
    key: "orderNumber",
    header: "Order",
    cell: (order) => (
      <Link className="font-black text-[#0a1628] hover:text-[#1f8a4c]" href={`/admin/orders/${order.id}`}>
        {order.orderNumber}
      </Link>
    ),
  },
  {
    key: "guestName",
    header: "Customer",
    cell: (order) => (
      <div>
        <p className="font-bold text-slate-900">{order.guestName || "Guest"}</p>
        <p className="text-xs text-slate-500">{order.guestEmail}</p>
      </div>
    ),
  },
  { key: "totalCents", header: "Total", cell: (order) => formatCurrency(order.totalCents) },
  { key: "paymentStatus", header: "Payment", cell: (order) => <StatusBadge type="payment" status={order.paymentStatus} /> },
  {
    key: "createdAt",
    header: "Created",
    cell: (order) => new Date(order.createdAt).toLocaleString(),
  },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const dashboard = await adminFetch<DashboardData>("/api/admin/dashboard");
        let pendingOrders: AdminOrder[] = [];
        try {
          const orderData = await adminFetch<{ orders: AdminOrder[] }>("/api/admin/orders?status=PAYMENT_PENDING");
          pendingOrders = orderData.orders.slice(0, 6);
        } catch {
          pendingOrders = [];
        }
        if (mounted) {
          setData(dashboard);
          setOrders(pendingOrders);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>;
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Command center</p>
        <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Matches" value={data.counts.matches} hint="Fixtures in inventory" icon={<CalendarDays />} />
        <StatCard label="Pending orders" value={data.counts.pendingOrders} hint="Awaiting payment review" icon={<ReceiptText />} />
        <StatCard
          label="Confirmed revenue"
          value={formatCurrency(data.counts.confirmedRevenueCents)}
          hint="Payment-confirmed orders"
          icon={<CircleDollarSign />}
        />
        <StatCard label="Open chats" value={data.counts.openChats} hint="Support conversations" icon={<MessageSquare />} />
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl text-[#0a1628]">Recent pending orders</h2>
            <p className="text-sm text-slate-500">Manual review queue for payment confirmation.</p>
          </div>
          <Link className="text-sm font-black text-[#1f8a4c] hover:underline" href="/admin/orders?status=PAYMENT_PENDING">
            View all orders
          </Link>
        </div>
        <DataTable columns={columns} rows={orders} rowKey={(order) => order.id} emptyState="No pending orders." />
      </section>
    </div>
  );
}
