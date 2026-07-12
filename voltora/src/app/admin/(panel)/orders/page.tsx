"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Orders</h1>
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["PENDING","AWAITING_PAYMENT","AWAITING_VERIFICATION","PAID","TICKET_ISSUED","CANCELLED","REFUNDED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input max-w-[180px]" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All payments</option>
          {["PENDING","AWAITING_VERIFICATION","PAID","FAILED","REFUNDED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <Button onClick={load}>Filter</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-3">Order ID</th>
              <th className="px-3 py-3">Customer</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Match</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Method</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Ticket</th>
              <th className="px-3 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-white/5">
                <td className="px-3 py-3">
                  <Link className="text-[var(--brand)]" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link>
                </td>
                <td className="px-3 py-3">{o.customerName}</td>
                <td className="px-3 py-3">{o.customerEmail}</td>
                <td className="px-3 py-3">{o.match?.title}</td>
                <td className="px-3 py-3">{o.items?.[0]?.categoryName}</td>
                <td className="px-3 py-3">{o.quantity}</td>
                <td className="px-3 py-3">{formatCurrency(o.totalCents)}</td>
                <td className="px-3 py-3">{o.paymentMethodName}</td>
                <td className="px-3 py-3">{o.paymentStatus}</td>
                <td className="px-3 py-3">{o.ticketStatus}</td>
                <td className="px-3 py-3">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
