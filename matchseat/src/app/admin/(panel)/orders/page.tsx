"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminOrder } from "@/components/admin/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";

const statusOptions = [
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "PAYMENT_CONFIRMED", label: "Payment confirmed" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

const paymentOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ status: "", paymentStatus: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = {
      status: params.get("status") || "",
      paymentStatus: params.get("paymentStatus") || "",
      search: params.get("search") || "",
    };
    setStatus(initial.status);
    setPaymentStatus(initial.paymentStatus);
    setSearch(initial.search);
    setQuery(initial);
  }, []);

  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.paymentStatus) params.set("paymentStatus", query.paymentStatus);
    if (query.search) params.set("search", query.search);

    setLoading(true);
    setError("");
    adminFetch<{ orders: AdminOrder[] }>(`/api/admin/orders${params.toString() ? `?${params}` : ""}`)
      .then((data) => {
        if (mounted) setOrders(data.orders);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load orders.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [query]);

  const columns = useMemo<DataTableColumn<AdminOrder>[]>(
    () => [
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
            <p className="font-bold text-slate-900">{order.guestName || order.user?.firstName || "Guest"}</p>
            <p className="text-xs text-slate-500">{order.guestEmail || order.user?.email}</p>
          </div>
        ),
      },
      { key: "totalCents", header: "Total", cell: (order) => formatCurrency(order.totalCents) },
      { key: "ticketCount", header: "Tickets" },
      { key: "status", header: "Order status", cell: (order) => <StatusBadge type="order" status={order.status} /> },
      { key: "paymentStatus", header: "Payment", cell: (order) => <StatusBadge type="payment" status={order.paymentStatus} /> },
      {
        key: "createdAt",
        header: "Created",
        cell: (order) => new Date(order.createdAt).toLocaleString(),
      },
    ],
    []
  );

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { status, paymentStatus, search };
    setQuery(next);
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.paymentStatus) params.set("paymentStatus", next.paymentStatus);
    if (next.search) params.set("search", next.search);
    window.history.replaceState(null, "", `/admin/orders${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Order desk</p>
        <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Orders</h1>
      </div>

      <form onSubmit={applyFilters} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1fr_1.3fr_auto]">
        <Select label="Order status" placeholder="All statuses" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select
          label="Payment status"
          placeholder="All payments"
          options={paymentOptions}
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        />
        <Input label="Search" placeholder="Order, email, or name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex items-end">
          <Button type="submit" fullWidth>
            Filter
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="grid min-h-[45vh] place-items-center rounded-3xl bg-white">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>
      ) : (
        <DataTable columns={columns} rows={orders} rowKey={(order) => order.id} emptyState="No orders found." />
      )}
    </div>
  );
}
