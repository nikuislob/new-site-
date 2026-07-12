"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";

type OrderRow = {
  id: string;
  orderNumber: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  paymentUrl: string | null;
  createdAt: string;
  customer: { firstName: string; lastName: string; email: string; phone: string | null };
  match: { homeTeam: string; opponent: string };
  category: { name: string };
  items: { seat: { label: string } }[];
};

export function OrdersAdmin({ initial }: { initial: OrderRow[] }) {
  const [orders, setOrders] = useState(initial);

  async function updatePayment(id: string, paymentStatus: string) {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        paymentStatus,
        status: paymentStatus === "PAID" ? "CONFIRMED" : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, paymentStatus: data.order.paymentStatus, status: data.order.status }
            : o
        )
      );
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Orders</h1>
      <p className="text-sm text-[var(--ink-muted)]">Customer info, seats, and payment status</p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Match / Seats</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[var(--line)]/50 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold">{o.orderNumber}</div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    {o.customer.firstName} {o.customer.lastName}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">{o.customer.email}</div>
                  {o.customer.phone && (
                    <div className="text-xs text-[var(--ink-muted)]">{o.customer.phone}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>
                    {o.match.homeTeam} vs {o.match.opponent}
                  </div>
                  <div className="text-xs">
                    {o.category.name} × {o.quantity}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {o.items.map((i) => i.seat.label).join(", ")}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{formatMoney(o.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-[var(--pitch-soft)] text-[var(--pitch)]">{o.paymentStatus}</span>
                  {o.paymentUrl && (
                    <a
                      href={o.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-xs text-[var(--pitch)] underline"
                    >
                      Payment URL
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <button type="button" className="text-left text-[var(--pitch)] underline" onClick={() => updatePayment(o.id, "PAID")}>
                      Mark Paid
                    </button>
                    <button type="button" className="text-left text-[#8a4b08] underline" onClick={() => updatePayment(o.id, "PENDING")}>
                      Mark Pending
                    </button>
                    <button type="button" className="text-left text-[var(--danger)] underline" onClick={() => updatePayment(o.id, "CANCELLED")}>
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
