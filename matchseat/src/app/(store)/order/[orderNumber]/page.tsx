"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type OrderData = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  ticketCount: number;
  paymentMethodName?: string | null;
  paymentUrlUsed?: string | null;
  items?: Array<{
    seatTier: string;
    quantity: number;
    lineTotalCents: number;
    matchSnapshot: string;
    sectionLabel?: string | null;
  }>;
};

export default function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ pay?: string; method?: string }>;
}) {
  return <OrderClient params={params} searchParams={searchParams} />;
}

function OrderClient({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ pay?: string; method?: string }>;
}) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [payUrl, setPayUrl] = useState("");
  const [method, setMethod] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await params;
      const sp = await searchParams;
      setPayUrl(sp.pay || "");
      setMethod(sp.method || "");
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(p.orderNumber)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Order not found");
        setOrder(data.order);
        if (!sp.pay && data.order?.paymentUrlUsed) setPayUrl(data.order.paymentUrlUsed);
        if (!sp.method && data.order?.paymentMethodName) setMethod(data.order.paymentMethodName);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    })();
  }, [params, searchParams]);

  if (loading) return <div className="container-page py-12 text-[var(--ink-muted)]">Loading order…</div>;
  if (error || !order) {
    return (
      <div className="container-page py-12">
        <p className="text-[var(--danger)]">{error || "Order not found"}</p>
        <Link href="/matches" className="btn btn-primary mt-4 inline-flex">
          Back to matches
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">Order created</p>
      <h1 className="mt-2 font-display text-5xl font-bold">{order.orderNumber}</h1>
      <p className="mt-3 text-[var(--ink-muted)]">
        Status: {order.status.replaceAll("_", " ")} · Payment: {order.paymentStatus}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">Tickets</h2>
          <ul className="mt-4 space-y-3">
            {(order.items || []).map((item, idx) => {
              let label = item.matchSnapshot;
              try {
                const snap = JSON.parse(item.matchSnapshot);
                label = `${snap.homeTeam} vs ${snap.awayTeam}`;
              } catch {
                /* keep */
              }
              return (
                <li key={idx} className="flex justify-between border-b border-[var(--line)] pb-3 text-sm">
                  <span>
                    {label}
                    <br />
                    <span className="text-[var(--ink-muted)]">
                      {item.seatTier} × {item.quantity}
                      {item.sectionLabel ? ` · ${item.sectionLabel}` : ""}
                    </span>
                  </span>
                  <span className="font-semibold">{formatCurrency(item.lineTotalCents)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between font-display text-3xl font-bold">
            <span>Total due</span>
            <span className="text-[var(--brand-deep)]">{formatCurrency(order.totalCents)}</span>
          </div>
        </div>

        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">Pay now</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Pay exactly {formatCurrency(order.totalCents)}
            {method ? ` via ${method}` : ""}. Include your Order ID in the payment note. Opening this link does not mark the order paid.
          </p>
          {payUrl ? (
            <div className="mt-5 flex flex-col gap-3">
              <a href={payUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full text-center">
                Open {method || "payment"} link
              </a>
              <Button variant="secondary" onClick={() => window.open(payUrl, "_self")}>
                Open in this tab
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--danger)]">Payment link unavailable — contact Chat Now.</p>
          )}
          <Link href="/account" className="mt-6 inline-block text-sm font-semibold text-[var(--brand-deep)] underline">
            View in account
          </Link>
        </div>
      </div>
    </div>
  );
}
