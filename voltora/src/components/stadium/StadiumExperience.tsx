"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveStadium, type SeatView } from "@/components/stadium/InteractiveStadium";
import { SeatBookingBar } from "@/components/stadium/SeatBookingBar";
import { formatCurrency } from "@/lib/utils";

type MatchPayload = {
  id: string;
  slug: string;
  title: string;
  salesEnabled: boolean;
  isSoldOut: boolean;
  seats: SeatView[];
  categories: Array<{ id: string; name: string; priceCents: number; available: number }>;
};

export function StadiumExperience() {
  const router = useRouter();
  const [match, setMatch] = useState<MatchPayload | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const maxSeats = 2;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/matches/featured");
        const data = await res.json();
        if (!data.match) {
          setError("No featured match is currently available.");
          return;
        }
        setMatch(data.match);
      } catch {
        setError("Unable to load stadium inventory.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSeats = useMemo(
    () => (match?.seats || []).filter((s) => selectedIds.includes(s.id)),
    [match, selectedIds]
  );

  const toggleSeat = (seat: SeatView) => {
    const prev = selectedIds;
    if (prev.includes(seat.id)) {
      setSelectedIds(prev.filter((id) => id !== seat.id));
      setNotice(null);
      return;
    }
    if (prev.length >= maxSeats) return;
    const existing = (match?.seats || []).filter((s) => prev.includes(s.id));
    if (existing.length && existing[0].categoryId !== seat.categoryId) {
      setSelectedIds([seat.id]);
      setNotice(
        `Seats must be from the same category. Selection switched to ${seat.categoryName}.`
      );
      return;
    }
    setSelectedIds([...prev, seat.id]);
    setNotice(null);
  };

  const continueCheckout = () => {
    if (!match || selectedSeats.length === 0) return;
    const payload = {
      matchId: match.id,
      matchSlug: match.slug,
      seatIds: selectedSeats.map((s) => s.id),
      seats: selectedSeats.map((s) => ({
        id: s.id,
        section: s.section,
        block: s.block,
        row: s.row,
        seatNumber: s.seatNumber,
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        zoneName: s.zoneName,
        priceCents: s.priceCents,
      })),
      ticketCategoryId: selectedSeats[0].categoryId,
      categoryName: selectedSeats[0].categoryName,
      quantity: selectedSeats.length,
      unitPriceCents: selectedSeats[0].priceCents,
    };
    sessionStorage.setItem("arenanights_checkout", JSON.stringify(payload));
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="container-page py-16">
        <div className="skeleton h-10 w-64" />
        <div className="mt-6 skeleton h-[420px] w-full" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container-page py-20">
        <div className="glass-panel p-8 text-center">
          <h1 className="font-display text-4xl text-white">Stadium Unavailable</h1>
          <p className="mt-3 text-white/60">{error || "Please check back soon."}</p>
        </div>
      </div>
    );
  }

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.priceCents, 0);

  return (
    <div className="pb-36 md:pb-16">
      <div className="container-page py-10">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Interactive Stadium
          </div>
          <h1 className="mt-2 font-display text-5xl tracking-[0.06em] text-white md:text-6xl">
            Choose Your Seats
          </h1>
          <p className="mt-3 text-white/70">
            Limited available seats are highlighted. Select up to {maxSeats} seats from the same
            category. From {formatCurrency(match.categories[0]?.priceCents || 8900)}.
          </p>
          {notice ? (
            <p className="mt-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
              {notice}
            </p>
          ) : null}
        </div>

        <div id="map" className="mt-8">
          <InteractiveStadium
            seats={match.seats}
            selectedIds={selectedIds}
            onToggle={toggleSeat}
            maxSeats={maxSeats}
          />
        </div>
      </div>

      <SeatBookingBar
        seats={selectedSeats}
        subtotalCents={subtotal}
        maxSeats={maxSeats}
        onContinue={continueCheckout}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
}
