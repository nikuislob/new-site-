"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketCategory: string;
  quantity: number;
  seatLabels: string;
  originalTotal: number;
  paymentAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  match: { homeTeam: { name: string }; awayTeam: { name: string } };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextQ = q, nextStatus = status) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextStatus) params.set("status", nextStatus);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, paymentStatus: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    load();
  }

  function exportCsv() {
    const header = [
      "Order ID",
      "Customer",
      "Email",
      "Phone",
      "Match",
      "Seats",
      "Qty",
      "Type",
      "Total",
      "Payment Amount",
      "Method",
      "Status",
      "Date",
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      `${o.match.homeTeam.name} vs ${o.match.awayTeam.name}`,
      o.seatLabels,
      o.quantity,
      o.ticketCategory,
      o.originalTotal,
      o.paymentAmount,
      o.paymentMethod,
      o.paymentStatus,
      o.createdAt,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pitchora-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Orders</h1>
          <p className="text-[var(--ink-muted)]">Search, filter, and export bookings.</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <Input id="q" label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, order ID" />
        <Select id="status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <div className="flex items-end">
          <Button variant="gold" onClick={() => load()}>
            Apply
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Match</th>
                <th className="px-3 py-3">Seats</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-3">
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{new Date(o.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p>{o.customerName}</p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {o.customerEmail} · {o.customerPhone}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    {o.match.homeTeam.name} vs {o.match.awayTeam.name}
                    <p className="text-xs text-[var(--ink-muted)]">
                      {o.ticketCategory} × {o.quantity} · {o.paymentMethod}
                    </p>
                  </td>
                  <td className="px-3 py-3">{o.seatLabels}</td>
                  <td className="px-3 py-3">
                    <p>{formatCurrency(o.originalTotal)}</p>
                    <p className="text-xs text-[var(--ink-muted)]">Pay {formatCurrency(o.paymentAmount)}</p>
                  </td>
                  <td className="px-3 py-3">{o.paymentStatus}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(o.id, "PAID")}>
                        Mark Paid
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "CANCELLED")}>
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-[var(--ink-muted)]">No orders found.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
