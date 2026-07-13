"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminOrder } from "@/components/admin/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";

const orderStatusOptions = [
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "PAYMENT_CONFIRMED", label: "Payment confirmed" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

const paymentStatusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<{ order: AdminOrder }>(`/api/admin/orders/${params.id}`);
      setOrder(data.order);
      setStatus(data.order.status);
      setPaymentStatus(data.order.paymentStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function patchOrder(payload: { status?: string; paymentStatus?: string }) {
    setSaving(true);
    setError("");
    try {
      const data = await adminFetch<{ order: AdminOrder }>(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setOrder(data.order);
      setStatus(data.order.status);
      setPaymentStatus(data.order.paymentStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Order desk</p>
          <h1 className="mt-2 font-display text-5xl text-[#0a1628]">{order.orderNumber}</h1>
          <p className="mt-2 text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Link className="font-black text-[#1f8a4c] hover:underline" href="/admin/orders">
          Back to orders
        </Link>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Customer</p>
          <p className="mt-2 font-bold text-slate-950">{order.guestName || "Guest"}</p>
          <p className="text-sm text-slate-500">{order.guestEmail}</p>
          <p className="text-sm text-slate-500">{order.guestPhone}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Payment</p>
          <p className="mt-2 font-bold text-slate-950">{order.paymentMethodName || "Not selected"}</p>
          <div className="mt-2 flex gap-2">
            <StatusBadge type="order" status={order.status} />
            <StatusBadge type="payment" status={order.paymentStatus} />
          </div>
          {order.paymentUrlUsed ? (
            <a className="mt-2 block break-all text-sm font-bold text-[#1f8a4c] hover:underline" href={order.paymentUrlUsed} target="_blank">
              {order.paymentUrlUsed}
            </a>
          ) : null}
          {order.paymentProvider || order.paymentExternalId ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {order.paymentProvider || "PROVIDER"}
              {order.paymentExternalId ? ` · ${order.paymentExternalId}` : ""}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-black text-[#0a1628]">{formatCurrency(order.totalCents)}</p>
          <p className="text-sm text-slate-500">{order.ticketCount} ticket(s)</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1fr_auto_auto]">
        <Select label="Order status" options={orderStatusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select
          label="Payment status"
          options={paymentStatusOptions}
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        />
        <div className="flex items-end">
          <Button type="button" loading={saving} onClick={() => patchOrder({ status, paymentStatus })}>
            Save status
          </Button>
        </div>
        <div className="flex items-end">
          <Button type="button" variant="dark" loading={saving} onClick={() => patchOrder({ paymentStatus: "CONFIRMED" })}>
            Confirm payment received
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-3xl text-[#0a1628]">Tickets</h2>
        <div className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-black text-slate-950">
                {item.match.homeTeam} vs {item.match.awayTeam}
              </p>
              <p className="text-sm text-slate-500">
                {item.match.venueName}, {item.match.venueCity} - {new Date(item.match.kickoffAt).toLocaleString()}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">
                {item.quantity} x {item.seatTier} ({item.sectionLabel || "Assigned later"}) - {formatCurrency(item.lineTotalCents)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
