"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

const ORDER_STATUSES = [
  "", "ORDER_CREATED", "PAYMENT_PENDING", "PAYMENT_CONFIRMED", "PROCESSING",
  "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
];

const PAYMENT_STATUSES = ["", "PENDING", "CONFIRMED", "FAILED", "REFUNDED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);
      const data = await adminFetch<{ orders: Order[] }>(`/api/admin/orders?${params}`);
      setOrders(data.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">View and manage customer orders</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => { e.preventDefault(); setSearch(q); }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7d9a]" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search order #, name, email…"
              className="w-full rounded-lg border border-[#1e2d45] bg-[#121a2b] py-2.5 pl-10 pr-3 text-sm text-white focus:border-[#00c2a8] focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-lg border border-[#1e2d45] bg-[#182338] px-4 py-2 text-sm text-white">Search</button>
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-[#1e2d45] bg-[#121a2b] px-3 py-2 text-sm text-white">
          <option value="">All statuses</option>
          {ORDER_STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="rounded-lg border border-[#1e2d45] bg-[#121a2b] px-3 py-2 text-sm text-white">
          <option value="">All payments</option>
          {PAYMENT_STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">{error}</div> : null}

      <DataTable
        loading={loading}
        data={orders}
        keyExtractor={(o) => o.id}
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
          { key: "customer", header: "Customer", cell: (o) => <div><div>{o.customerName}</div><div className="text-xs text-[#8b9cb8]">{o.customerEmail}</div></div> },
          { key: "total", header: "Total", cell: (o) => formatCurrency(o.total) },
          { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} variant="order" /> },
          { key: "payment", header: "Payment", cell: (o) => <StatusBadge status={o.paymentStatus} variant="payment" /> },
          { key: "date", header: "Date", cell: (o) => format(new Date(o.createdAt), "MMM d, yyyy") },
        ]}
      />
    </div>
  );
}
