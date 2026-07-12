"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SeatMap, type SeatData } from "@/components/seats/SeatMap";
import { Button } from "@/components/ui/Button";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { useBookingStore } from "@/store/booking";

type MatchPayload = {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

type SettingsPayload = {
  upperSeatPrice: number;
  closerSeatPrice: number;
  maxTicketsPerOrder: number;
};

export function BookingClient({ matchId }: { matchId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as "UPPER" | "CLOSER") || "UPPER";

  const { seats, category, setMatch, setCategory, toggleSeat, clearSeats } = useBookingStore();
  const [match, setMatchData] = useState<MatchPayload | null>(null);
  const [allSeats, setAllSeats] = useState<SeatData[]>([]);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [qtyAttempt, setQtyAttempt] = useState(1);

  useEffect(() => {
    setMatch(matchId);
    setCategory(initialCategory);
  }, [matchId, initialCategory, setMatch, setCategory]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [matchRes, seatsRes, settingsRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`),
          fetch(`/api/matches/${matchId}/seats`),
          fetch("/api/settings/public"),
        ]);
        const matchJson = await matchRes.json();
        const seatsJson = await seatsRes.json();
        const settingsJson = await settingsRes.json();
        if (!cancelled) {
          if (!matchRes.ok) throw new Error(matchJson.error || "Match unavailable");
          setMatchData(matchJson.match);
          setAllSeats(seatsJson.seats || []);
          setSettings(settingsJson.settings);
        }
      } catch (e) {
        if (!cancelled) setMessage(e instanceof Error ? e.message : "Failed to load booking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const activeCategory = category || initialCategory;
  const maxTickets = settings?.maxTicketsPerOrder ?? 2;
  const unitPrice =
    activeCategory === "CLOSER"
      ? settings?.closerSeatPrice ?? 218
      : settings?.upperSeatPrice ?? 89;

  const total = unitPrice * seats.length;

  const selectedIds = useMemo(() => seats.map((s) => s.id), [seats]);

  if (loading) return <Spinner label="Loading stadium map..." />;

  return (
    <div className="space-y-8 page-enter">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--gold)]">Ticket Booking</p>
        <h1 className="font-display text-5xl md:text-6xl">
          {match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : "Select Seats"}
        </h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Choose a category, then pick up to {maxTickets} seats on the interactive map.
        </p>
      </div>

      {message ? <Notify tone="error">{message}</Notify> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {(["UPPER", "CLOSER"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategory(cat);
              clearSeats();
              setMessage(null);
            }}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              activeCategory === cat
                ? "border-[var(--gold)] bg-[var(--gold-soft)]"
                : "border-[var(--line)] bg-black/30"
            }`}
          >
            <p className="font-semibold">{cat === "UPPER" ? "Upper Side Seats" : "Closer View Seats"}</p>
            <p className="text-sm text-[var(--ink-muted)]">
              {formatCurrency(cat === "UPPER" ? settings?.upperSeatPrice ?? 89 : settings?.closerSeatPrice ?? 218)} each
            </p>
          </button>
        ))}
      </div>

      <div className="glass rounded-[var(--radius)] p-4 md:p-5">
        <label className="block text-sm text-[var(--ink-muted)]">
          Quantity selector (max {maxTickets})
          <input
            type="number"
            min={1}
            max={maxTickets}
            value={Math.min(qtyAttempt, maxTickets)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n > maxTickets) {
                setMessage("For bookings of 3 or more tickets, please contact our support team.");
                setQtyAttempt(maxTickets);
                return;
              }
              setQtyAttempt(Math.max(1, n || 1));
              setMessage(null);
            }}
            className="mt-2 w-full max-w-xs rounded-xl border border-[var(--line)] bg-black/40 px-4 py-3 text-white"
          />
        </label>
        {message?.includes("3 or more") ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <Link href={`/bulk-request?matchId=${matchId}`}>
                <Button variant="gold" size="sm">Contact Admin</Button>
              </Link>
              <Link href="/contact">
                <Button variant="secondary" size="sm">Live Chat / Contact</Button>
              </Link>
              <a href="https://wa.me/15550142200" target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">WhatsApp</Button>
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <SeatMap
        seats={allSeats}
        selectedIds={selectedIds}
        categoryFilter={activeCategory}
        onToggle={(seat) => {
          const result = toggleSeat(seat, maxTickets);
          if (!result.ok) setMessage(result.message || "Unable to select seat");
          else setMessage(null);
        }}
      />

      <div className="glass sticky bottom-4 z-20 rounded-[var(--radius)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[var(--ink-muted)]">Order summary</p>
            <p className="font-semibold">
              {seats.length === 0
                ? "No seats selected"
                : seats.map((s) => `${s.section}-${s.row}-${s.number}`).join(", ")}
            </p>
            <p className="text-[var(--gold)]">{formatCurrency(total)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => clearSeats()}>
              Clear
            </Button>
            <Button
              variant="gold"
              disabled={seats.length === 0 || seats.length > maxTickets}
              onClick={() => router.push("/checkout")}
            >
              Continue to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
