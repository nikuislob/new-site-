"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import { SEAT_TIERS, MAX_TICKETS_PER_ORDER } from "@/lib/tickets";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";

export function CartView() {
  const { items, setQuantity, removeItem, clear, totalCents, ticketCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <p className="text-[var(--ink-muted)]">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="card-quiet p-10 text-center">
        <p className="font-display text-3xl font-bold">Your cart is empty</p>
        <p className="mt-2 text-[var(--ink-muted)]">Pick a match and choose Basic or Premium seats.</p>
        <Link href="/matches" className="btn btn-primary mt-6 inline-flex">
          Browse matches
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={`${item.matchId}-${item.seatTier}`} className="card-quiet p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-bold">{item.matchLabel}</p>
                <p className="text-sm text-[var(--ink-muted)]">{item.venueLabel}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--brand-deep)]">
                  {SEAT_TIERS[item.seatTier].label} · {formatCurrency(item.unitPriceCents)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={item.quantity}
                  onChange={(e) => {
                    const res = setQuantity(item.matchId, item.seatTier, Number(e.target.value));
                    setError(res.ok ? "" : res.error || "Limit reached");
                  }}
                  className="rounded-xl border border-[var(--line)] px-3 py-2"
                >
                  {[1, 2].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--danger)]"
                  onClick={() => removeItem(item.matchId, item.seatTier)}
                >
                  Remove
                </button>
              </div>
            </div>
            <p className="mt-3 text-right font-bold">
              {formatCurrency(item.unitPriceCents * item.quantity)}
            </p>
          </div>
        ))}
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button type="button" onClick={clear} className="text-sm font-semibold text-[var(--ink-muted)] underline">
          Clear cart
        </button>
      </div>

      <aside className="card-quiet h-fit p-6">
        <h2 className="font-display text-3xl font-bold">Order summary</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {ticketCount()} / {MAX_TICKETS_PER_ORDER} tickets
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4">
          <span className="font-semibold">Total due</span>
          <span className="font-display text-4xl font-bold text-[var(--brand-deep)]">
            {formatCurrency(totalCents())}
          </span>
        </div>
        <p className="mt-3 text-xs text-[var(--ink-muted)]">
          Checkout opens the Cash App or Apple Pay link for exactly this amount.
        </p>
        <Link href="/checkout" className="btn btn-primary mt-6 w-full">
          Continue to checkout
        </Link>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => (window.location.href = "/matches")}>
          Add another ticket
        </Button>
      </aside>
    </div>
  );
}
