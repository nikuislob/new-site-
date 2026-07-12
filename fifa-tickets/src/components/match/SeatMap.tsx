"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { MAX_ONLINE_TICKETS } from "@/lib/payments";
import { MessageCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";

export type SeatDTO = {
  id: string;
  section: string;
  row: string;
  number: number;
  label: string;
  status: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryColor: string;
  price: number;
  x: number | null;
  y: number | null;
};

export type CategoryDTO = {
  id: string;
  code: string;
  name: string;
  price: number;
  color: string;
  description: string | null;
};

type Props = {
  matchId: string;
  matchSlug: string;
  seats: SeatDTO[];
  categories: CategoryDTO[];
};

export function SeatMap({ matchId, matchSlug, seats, categories }: Props) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(
    () => seats.filter((s) => s.categoryId === categoryId),
    [seats, categoryId]
  );

  const selectedSeats = seats.filter((s) => selected.includes(s.id));
  const activeCategory = categories.find((c) => c.id === categoryId);
  const quantity = selected.length;
  const overLimit = quantity > MAX_ONLINE_TICKETS;
  const canCheckout = quantity >= 1 && quantity <= MAX_ONLINE_TICKETS;

  const sections = useMemo(() => {
    const map = new Map<string, SeatDTO[]>();
    for (const seat of filtered) {
      const list = map.get(seat.section) ?? [];
      list.push(seat);
      map.set(seat.section, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function toggleSeat(seat: SeatDTO) {
    if (seat.status !== "AVAILABLE") return;
    setSelected((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= MAX_ONLINE_TICKETS + 1) return prev;
      // Allow selecting a 3rd to trigger Chat Now UX, but not more than 3 visual
      if (prev.length >= 3) return prev;
      return [...prev, seat.id];
    });
  }

  function continueCheckout() {
    if (!canCheckout || !activeCategory) return;
    const params = new URLSearchParams({
      matchId,
      categoryId: activeCategory.id,
      seats: selected.join(","),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow)] sm:p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(cat.id);
                setSelected([]);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoryId === cat.id
                  ? "bg-[var(--pitch)] text-white"
                  : "bg-[var(--pitch-soft)] text-[var(--pitch-deep)]"
              }`}
            >
              {cat.name} · {formatMoney(cat.price)}
            </button>
          ))}
        </div>

        <div className="mb-4 rounded-xl bg-[var(--pitch)] px-4 py-3 text-center text-sm font-semibold text-white">
          Pitch / Field View
        </div>

        <div className="space-y-6 overflow-x-auto">
          {sections.map(([section, sectionSeats]) => {
            const rows = Array.from(new Set(sectionSeats.map((s) => s.row))).sort();
            return (
              <div key={section}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Section {section}
                </p>
                <div className="space-y-2">
                  {rows.map((row) => {
                    const rowSeats = sectionSeats
                      .filter((s) => s.row === row)
                      .sort((a, b) => a.number - b.number);
                    return (
                      <div key={row} className="flex items-center gap-2">
                        <span className="w-6 text-xs font-bold text-[var(--ink-muted)]">{row}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rowSeats.map((seat) => {
                            const isSelected = selected.includes(seat.id);
                            const isSold = seat.status === "SOLD" || seat.status === "HELD";
                            return (
                              <button
                                key={seat.id}
                                type="button"
                                title={seat.label}
                                disabled={isSold}
                                onClick={() => toggleSeat(seat)}
                                className={`seat-enter h-8 w-8 rounded-md text-[10px] font-bold transition ${
                                  isSold
                                    ? "cursor-not-allowed bg-[#d7dde0] text-[#8a9399]"
                                    : isSelected
                                      ? "bg-[var(--gold)] text-[#1a1505] ring-2 ring-[var(--pitch)]"
                                      : "bg-[var(--pitch-soft)] text-[var(--pitch-deep)] hover:bg-[var(--pitch)] hover:text-white"
                                }`}
                                style={
                                  !isSold && !isSelected
                                    ? { boxShadow: `inset 0 0 0 2px ${activeCategory?.color ?? "#1a7f4b"}33` }
                                    : undefined
                                }
                              >
                                {seat.number}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-[var(--pitch-soft)] ring-1 ring-[var(--pitch)]/30" /> Available
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-[var(--gold)]" /> Selected
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-[#d7dde0]" /> Sold
          </span>
        </div>
      </div>

      <aside className="h-fit rounded-2xl bg-white p-6 shadow-[var(--shadow)] lg:sticky lg:top-24">
        <h3 className="font-display text-3xl tracking-[0.05em] text-[var(--pitch-deep)]">Your Selection</h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Online checkout allows up to {MAX_ONLINE_TICKETS} seats per transaction.
        </p>

        {selectedSeats.length === 0 ? (
          <p className="mt-6 rounded-xl bg-[var(--pitch-soft)] p-4 text-sm text-[var(--pitch-deep)]">
            Tap available seats on the map to begin.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {selectedSeats.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
              >
                <span className="font-semibold">{s.label}</span>
                <span>{formatMoney(s.price)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <div className="flex justify-between text-sm">
            <span>Quantity</span>
            <span className="font-bold">{quantity}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-[var(--pitch)]">
              {formatMoney(selectedSeats.reduce((sum, s) => sum + s.price, 0))}
            </span>
          </div>
        </div>

        {overLimit ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-xl bg-[#fff4e5] p-3 text-sm text-[#8a4b08]">
              Online checkout is limited to {MAX_ONLINE_TICKETS} tickets. For {quantity}+ seats, contact bulk sales.
            </p>
            <Link
              href={`/contact?match=${matchSlug}&qty=${quantity}`}
              className="btn btn-gold w-full"
            >
              <MessageCircle size={18} /> Chat Now
            </Link>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canCheckout}
            onClick={continueCheckout}
            className="btn btn-primary mt-5 w-full"
          >
            <ShoppingCart size={18} /> Continue to Checkout
          </button>
        )}
      </aside>
    </div>
  );
}
