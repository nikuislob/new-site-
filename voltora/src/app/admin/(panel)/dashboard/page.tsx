"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ShoppingBag,
  Clock,
  DollarSign,
  Package,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

type DashboardData = {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    ordersLast30: number;
    totalRevenue: number;
    totalProducts: number;
    lowStockProducts: number;
    openTickets: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    salesCount: number;
    stockQuantity: number;
  }>;
};

type Conversation = {
  id: string;
  subject: string | null;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  lastMessageAt: string;
  user?: { email: string } | null;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [support, setSupport] = useState<Conversation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dash, conv] = await Promise.all([
          adminFetch<DashboardData>("/api/admin/dashboard"),
          adminFetch<{ conversations: Conversation[] }>("/api/admin/support?status=OPEN&limit=5"),
        ]);
        setData(dash);
        setSupport(conv.conversations);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-[#8b9cb8]">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300" role="alert">
        {error || "Failed to load dashboard"}
      </div>
    );
  }

  const { stats, recentOrders, topProducts } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">Store overview and recent activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={stats.totalOrders} icon={ShoppingBag} />
        <StatCard label="Pending payment" value={stats.pendingOrders} icon={Clock} hint="Awaiting confirmation" />
        <StatCard label="Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} />
        <StatCard label="Orders (30d)" value={stats.ordersLast30} icon={ShoppingBag} />
        <StatCard label="Active products" value={stats.totalProducts} icon={Package} />
        <StatCard label="Low stock" value={stats.lowStockProducts} icon={AlertTriangle} hint="≤ 5 units" />
        <StatCard label="Open tickets" value={stats.openTickets} icon={MessageSquare} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-[#00c2a8] hover:underline">
              View all
            </Link>
          </div>
          <DataTable
            data={recentOrders}
            keyExtractor={(o) => o.id}
            emptyMessage="No orders yet."
            columns={[
              {
                key: "order",
                header: "Order",
                cell: (o) => (
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#00c2a8] hover:underline">
                    {o.orderNumber}
                  </Link>
                ),
              },
              {
                key: "customer",
                header: "Customer",
                cell: (o) => o.customerName,
              },
              {
                key: "total",
                header: "Total",
                cell: (o) => formatCurrency(o.total),
              },
              {
                key: "status",
                header: "Status",
                cell: (o) => <StatusBadge status={o.status} variant="order" />,
              },
              {
                key: "date",
                header: "Date",
                cell: (o) => format(new Date(o.createdAt), "MMM d, yyyy"),
              },
            ]}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Open support</h2>
            <Link href="/admin/support" className="text-sm text-[#00c2a8] hover:underline">
              View inbox
            </Link>
          </div>
          <DataTable
            data={support}
            keyExtractor={(c) => c.id}
            emptyMessage="No open conversations."
            columns={[
              {
                key: "subject",
                header: "Subject",
                cell: (c) => (
                  <Link href={`/admin/support/${c.id}`} className="font-medium text-[#00c2a8] hover:underline">
                    {c.subject || "No subject"}
                  </Link>
                ),
              },
              {
                key: "from",
                header: "From",
                cell: (c) => c.guestName || c.user?.email || c.guestEmail || "—",
              },
              {
                key: "status",
                header: "Status",
                cell: (c) => <StatusBadge status={c.status} variant="conversation" />,
              },
              {
                key: "updated",
                header: "Updated",
                cell: (c) => format(new Date(c.lastMessageAt), "MMM d, h:mm a"),
              },
            ]}
          />
        </section>
      </div>

      {topProducts.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-white">Top products</h2>
          <DataTable
            data={topProducts}
            keyExtractor={(p) => p.id}
            columns={[
              {
                key: "name",
                header: "Product",
                cell: (p) => (
                  <Link href={`/admin/products/${p.id}`} className="text-[#00c2a8] hover:underline">
                    {p.name}
                  </Link>
                ),
              },
              { key: "sales", header: "Sales", cell: (p) => p.salesCount },
              { key: "stock", header: "Stock", cell: (p) => p.stockQuantity },
            ]}
          />
        </section>
      ) : null}
    </div>
  );
}
