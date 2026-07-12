"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StadiumMap, type OfferedSeat } from "@/components/seats/StadiumMap";
import { Button } from "@/components/ui/Button";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";

type Settings = {
  upperSeatPrice: number;
  closerSeatPrice: number;
  maxTicketsPerOrder: number;
};

const HOLD_KEY = "pitchora_hold_token";

export function BookingClient({ matchId }: { matchId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as "UPPER" | "CLOSER") || "UPPER";

  const [category, setCategory] = useState<"UPPER" | "CLOSER">(initialCategory);
  const [offered, setOffered] = useState<OfferedSeat[]>([]);
  const [selected, setSelected] = useState<OfferedSeat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [scarcity, setScarcity] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [matchTitle, setMatchTitle] = useState("Select Seats");
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "warn" | "info" | "success">("info");

  const maxTickets = settings?.maxTicketsPerOrder ?? 2;

  const loadOffers = useCallback(async (cat: "UPPER" | "CLOSER", token?: string | null) => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ category: cat });
      if (token) params.set("holdToken", token);
      const [seatsRes, settingsRes] = await Promise.all([
        fetch(`/api/matches/${matchId}/available-seats?${params}`),
        fetch("/api/settings/public"),
      ]);
      const seatsJson = await seatsRes.json();
      const settingsJson = await settingsRes.json();
      if (!seatsRes.ok) throw new Error(seatsJson.error || "Failed to load seats");

      setSettings(settingsJson.settings);
      setOffered(seatsJson.seats || []);
      setTotalAvailable(seatsJson.totalAvailable || 0);
      setScarcity(seatsJson.scarcityMessage || "");
      if (seatsJson.match) {
        setMatchTitle(`${seatsJson.match.homeTeam} vs ${seatsJson.match.awayTeam}`);
      }

      // Restore selection from held seats if any
      if (seatsJson.heldSeats?.length) {
        setSelected(seatsJson.heldSeats);
        setActiveId(seatsJson.heldSeats[0]?.id || null);
      } else {
        setSelected([]);
        setActiveId(null);
      }
    } catch (e) {
      setMessageTone("error");
      setMessage(e instanceof Error ? e.message : "Failed to load seats");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(`${HOLD_KEY}_${matchId}`) : null;
    if (saved) setHoldToken(saved);
    loadOffers(initialCategory, saved);
  }, [initialCategory, loadOffers, matchId]);

  const selectedIds = useMemo(() => selected.map((s) => s.id), [selected]);
  const total = selected.reduce((sum, s) => sum + s.price, 0);

  function toggleSeat(seat: OfferedSeat) {
    setActiveId(seat.id);
    const exists = selected.find((s) => s.id === seat.id);
    if (exists) {
      setSelected(selected.filter((s) => s.id !== seat.id));
      setMessage(null);
      return;
    }
    if (selected.length >= maxTickets) {
      setMessageTone("warn");
      setMessage(
        maxTickets <= 2
          ? "Maximum 2 tickets per order. For 3 or more, contact support."
          : `Maximum ${maxTickets} seats allowed.`
      );
      return;
    }
    setSelected([...selected, seat]);
    setMessage(null);
  }

  async function refreshRandom() {
    // Keep hold token so held seats stay; get new random for remaining slots
    await loadOffers(category, holdToken);
  }

  async function continueCheckout() {
    if (selected.length === 0) return;
    setHolding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          seatIds: selected.map((s) => s.id),
          holdToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reserve seats");

      const token = data.hold.holdToken as string;
      setHoldToken(token);
      sessionStorage.setItem(`${HOLD_KEY}_${matchId}`, token);
      sessionStorage.setItem(
        "pitchora_checkout",
        JSON.stringify({
          matchId,
          category,
          seatIds: selected.map((s) => s.id),
          holdToken: token,
          seats: data.hold.seats,
          expiresAt: data.hold.expiresAt,
        })
      );
      router.push("/checkout");
    } catch (e) {
      setMessageTone("error");
      setMessage(e instanceof Error ? e.message : "Hold failed");
      await loadOffers(category, holdToken);
    } finally {
      setHolding(false);
    }
  }

  if (loading) return <Spinner label="Loading stadium seats..." />;

  return (
    <div className="space-y-8 page-enter">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--gold)]">Football Stadium Tickets</p>
        <h1 className="font-display text-5xl md:text-6xl">{matchTitle}</h1>
        <p className="mt-2 text-[var(--ink-muted)]">
          Match → Stadium → up to 9 available options → Select → Checkout
        </p>
      </div>

      {message ? <Notify tone={messageTone}>{message}</Notify> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {(["UPPER", "CLOSER"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategory(cat);
              setSelected([]);
              loadOffers(cat, null);
            }}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              category === cat ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--line)] bg-black/30"
            }`}
          >
            <p className="font-semibold">{cat === "UPPER" ? "Upper Side Seats" : "Closer View Seats"}</p>
            <p className="text-sm text-[var(--ink-muted)]">
              {formatCurrency(cat === "UPPER" ? settings?.upperSeatPrice ?? 89 : settings?.closerSeatPrice ?? 218)} each
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Notify tone="info">
          {scarcity || `Only ${offered.length} available seat options shown`}
          {totalAvailable > 0 ? ` · ${totalAvailable} total available in inventory` : ""}
        </Notify>
        <Button variant="secondary" size="sm" onClick={refreshRandom}>
          Shuffle new 9 options
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <StadiumMap
          offered={offered}
          selectedIds={selectedIds}
          activeSeatId={activeId}
          onSelectZone={(zone) => {
            const first = offered.find((s) => s.mapZone === zone);
            if (first) setActiveId(first.id);
          }}
        />

        <div className="space-y-3">
          <h2 className="font-display text-3xl">Available seat options</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            Randomly selected from real inventory. Max {maxTickets} per order.
          </p>
          {offered.length === 0 ? (
            <Notify tone="warn">No available seats in this category right now.</Notify>
          ) : (
            offered.map((seat, idx) => {
              const isSelected = selectedIds.includes(seat.id);
              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => toggleSeat(seat)}
                  onMouseEnter={() => setActiveId(seat.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-[var(--gold)] bg-[var(--gold-soft)]"
                      : "border-[var(--line)] bg-black/30 hover:border-[var(--emerald)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--emerald)] text-xs font-bold text-black">
                          {idx + 1}
                        </span>
                        {seat.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-muted)]">
                        {seat.block} · Section {seat.section} · {seat.category === "CLOSER" ? "Closer View" : "Upper Side"}
                      </p>
                    </div>
                    <p className="font-display text-2xl text-[var(--gold)]">{formatCurrency(seat.price)}</p>
                  </div>
                </button>
              );
            })
          )}

          {selected.length >= maxTickets ? (
            <div className="space-y-2">
              <Notify tone="warn">For bookings of 3 or more tickets, please contact our support team.</Notify>
              <div className="flex flex-wrap gap-2">
                <Link href={`/bulk-request?matchId=${matchId}`}>
                  <Button variant="gold" size="sm">Contact Admin</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary" size="sm">Live Chat</Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass sticky bottom-4 z-20 rounded-[var(--radius)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[var(--ink-muted)]">Selected (held on continue)</p>
            <p className="font-semibold">
              {selected.length === 0 ? "No seats selected" : selected.map((s) => s.label).join(" · ")}
            </p>
            <p className="text-[var(--gold)]">{formatCurrency(total)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setSelected([]);
                setMessage(null);
              }}
            >
              Clear
            </Button>
            <Button
              variant="gold"
              disabled={selected.length === 0 || holding}
              onClick={continueCheckout}
            >
              {holding ? "Reserving..." : "Hold & Continue to Checkout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
