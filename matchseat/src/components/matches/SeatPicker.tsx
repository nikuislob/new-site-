"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SEAT_TIERS, type SeatTier, MAX_TICKETS_PER_ORDER } from "@/lib/tickets";
import { useCart } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type MatchInfo = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venueName: string;
  venueCity: string;
  venueState: string;
  kickoffAt: string;
  basicStock: number;
  premiumStock: number;
};

export function SeatPicker({ match }: { match: MatchInfo }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const ticketCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [tier, setTier] = useState<SeatTier>("BASIC");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const remaining = MAX_TICKETS_PER_ORDER - ticketCount;
  const stock = tier === "BASIC" ? match.basicStock : match.premiumStock;
  const maxQty = Math.max(0, Math.min(remaining, stock, MAX_TICKETS_PER_ORDER));

  const add = (goCheckout = false) => {
    setError("");
    setOk("");
    if (maxQty < 1) {
      setError(`Maximum ${MAX_TICKETS_PER_ORDER} tickets per customer.`);
      return;
    }
    const result = addItem({
      matchId: match.id,
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
      venueLabel: `${match.venueName}, ${match.venueCity} ${match.venueState}`,
      kickoffAt: match.kickoffAt,
      seatTier: tier,
      quantity: Math.min(qty, maxQty),
      unitPriceCents: SEAT_TIERS[tier].priceCents,
    });
    if (!result.ok) {
      setError(result.error || "Could not add tickets");
      return;
    }
    if (goCheckout) {
      router.push("/checkout");
      return;
    }
    setOk("Added to cart");
    router.refresh();
  };

  return (
    <div className="card-quiet p-6">
      <h2 className="font-display text-3xl font-bold text-[var(--ink)]">Choose seating</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Basic $70 · Premium $140 · Max {MAX_TICKETS_PER_ORDER} tickets per customer
      </p>

      <div className="mt-6 grid gap-3">
        {(Object.keys(SEAT_TIERS) as SeatTier[]).map((key) => {
          const seat = SEAT_TIERS[key];
          const available = key === "BASIC" ? match.basicStock : match.premiumStock;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTier(key);
                setQty(1);
              }}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                tier === key
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[0_0_0_1px_var(--brand)]"
                  : "border-[var(--line)] bg-white hover:border-[var(--brand)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold">{seat.label}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">{seat.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--brand-deep)]">
                    {seat.sectionHint}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-bold text-[var(--brand-deep)]">
                    {formatCurrency(seat.priceCents)}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">{available} left</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <label className="text-sm font-semibold" htmlFor="qty">
          Quantity
        </label>
        <select
          id="qty"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
        >
          {[1, 2].filter((n) => n <= Math.max(maxQty, 1)).map((n) => (
            <option key={n} value={n} disabled={n > maxQty}>
              {n}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--ink-muted)]">
          {remaining} ticket slot{remaining === 1 ? "" : "s"} remaining in your order
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-[var(--success)]">{ok}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => add(false)} disabled={maxQty < 1}>
          Add to cart · {formatCurrency(SEAT_TIERS[tier].priceCents * Math.min(qty, Math.max(maxQty, 1)))}
        </Button>
        <Button variant="dark" onClick={() => add(true)} disabled={maxQty < 1}>
          Buy now
        </Button>
      </div>
    </div>
  );
}
