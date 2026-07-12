"use client";

import { useMemo, useState } from "react";
import { formatCurrency, TICKET_PRICES, type TicketType } from "@/lib/utils";
import { openBulkChat } from "@/components/chat/ChatWidget";
import { StadiumSeatMap } from "@/components/tickets/StadiumSeatMap";

export type MatchCard = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  stadiumViewUrl: string;
  matchDate: string;
  standardAvailable: number;
  premiumAvailable: number;
};

type Props = {
  matches: MatchCard[];
};

export function TicketExperience({ matches }: Props) {
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || "");
  const [ticketType, setTicketType] = useState<TicketType>("standard");
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const match = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || matches[0],
    [matches, selectedMatchId]
  );

  const overLimit = quantity > 2;
  const unitPrice = TICKET_PRICES[ticketType];
  const total = unitPrice * Math.min(quantity, 2);

  const checkout = async () => {
    if (!match || overLimit) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          customerEmail: email,
          customerName: name || undefined,
          ticketType,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      setSuccess(
        `Order ${data.order.id.slice(0, 8)}… created (${data.order.linkWorkflow}). Status: ${data.order.paymentStatus}. Assigned: ${data.order.assignedSeats.join(", ")}. An admin will paste your Apple Pay / Cash App link next.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return (
      <div className="glass-panel p-8 text-center">
        <h2 className="text-2xl font-black text-white">No upcoming matches</h2>
        <p className="mt-2 text-slate-400">Check back soon for new kickoff listings.</p>
      </div>
    );
  }

  return (
    <div id="tickets" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="glass-panel p-5">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-lime-400">
            Upcoming Match
          </div>
          <div className="mt-3 grid gap-3">
            {matches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMatchId(m.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  m.id === match.id
                    ? "border-lime-400 bg-emerald-900/50"
                    : "border-white/10 bg-slate-950/40 hover:border-emerald-400/40"
                }`}
              >
                <div className="text-lg font-black text-white">
                  {m.homeTeam} <span className="text-lime-400">vs</span> {m.awayTeam}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {new Date(m.matchDate).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {m.venue}
                </div>
              </button>
            ))}
          </div>
        </div>

        <StadiumSeatMap ticketType={ticketType} quantity={Math.min(quantity, 2)} />
      </div>

      <div className="glass-panel p-5 md:p-6">
        <h2 className="text-3xl font-black tracking-tight text-white">Choose Your Seats</h2>
        <p className="mt-2 text-sm text-slate-400">
          Two tiers only. Max 2 tickets per online order. USA sports energy, clean checkout.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                key: "standard" as const,
                label: "Standard View",
                price: TICKET_PRICES.standard,
                available: match.standardAvailable,
                note: "Upper / outer stadium sections",
              },
              {
                key: "premium" as const,
                label: "Premium View",
                price: TICKET_PRICES.premium,
                available: match.premiumAvailable,
                note: "Closer / central pitch view",
              },
            ] as const
          ).map((tier) => (
            <button
              key={tier.key}
              type="button"
              onClick={() => setTicketType(tier.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                ticketType === tier.key
                  ? "border-lime-400 bg-lime-400/10 shadow-[0_0_24px_rgba(163,230,53,0.2)]"
                  : "border-white/10 bg-slate-950/50 hover:border-emerald-400/30"
              }`}
            >
              <div className="text-xs font-black uppercase tracking-[0.14em] text-lime-400">
                {tier.label}
              </div>
              <div className="mt-2 text-3xl font-black text-white">{formatCurrency(tier.price)}</div>
              <div className="mt-1 text-xs text-slate-400">{tier.note}</div>
              <div className="mt-3 text-xs font-bold text-emerald-300">
                {tier.available} available
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label className="label">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary !px-4"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <div className="min-w-12 text-center text-2xl font-black text-white">{quantity}</div>
            <button
              type="button"
              className="btn btn-secondary !px-4"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {overLimit ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border-2 border-rose-400/60 bg-rose-500/15 p-4">
              <div className="text-lg font-black text-rose-200">
                Maximum of 2 tickets allowed per online transaction. For bulk purchasing or group
                sales, please contact our live desk.
              </div>
            </div>
            <button type="button" className="btn btn-danger w-full pulse-glow" onClick={openBulkChat}>
              Chat with Bulk Support
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-end justify-between rounded-2xl border border-lime-400/20 bg-emerald-950/40 px-4 py-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Order Total
                </div>
                <div className="text-sm text-slate-300">
                  {quantity} × {formatCurrency(unitPrice)} ({ticketType})
                </div>
              </div>
              <div className="text-3xl font-black text-lime-400">{formatCurrency(total)}</div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-full pulse-glow"
              disabled={loading || !email}
              onClick={checkout}
            >
              {loading ? "Securing…" : "Secure Tickets via Apple Pay / Cash App Link"}
            </button>
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
      </div>
    </div>
  );
}
