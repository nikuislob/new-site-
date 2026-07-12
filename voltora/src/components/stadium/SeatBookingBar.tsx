"use client";

import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { SeatView } from "./InteractiveStadium";

export function SeatBookingBar({
  seats,
  subtotalCents,
  maxSeats,
  onContinue,
  onClear,
}: {
  seats: SeatView[];
  subtotalCents: number;
  maxSeats: number;
  onContinue: () => void;
  onClear: () => void;
}) {
  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b1026]/95 p-4 backdrop-blur-xl md:static md:mt-8 md:rounded-3xl md:border md:bg-[var(--glass)]">
      <div className="container-page flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:px-0">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">
            Selected ({seats.length}/{maxSeats})
          </div>
          {seats.length === 0 ? (
            <div className="text-sm text-white/60">Tap available seats on the map</div>
          ) : (
            <div className="mt-1 space-y-1">
              {seats.map((s) => (
                <div key={s.id} className="text-sm font-semibold text-white">
                  Sec {s.section} · Block {s.block} · Row {s.row} · Seat {s.seatNumber}
                  <span className="ml-2 text-xs font-normal text-white/50">{s.categoryName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-white/45">Subtotal</div>
            <div className="font-display text-3xl text-[var(--accent)]">
              {formatCurrency(subtotalCents)}
            </div>
          </div>
          {seats.length ? (
            <Button variant="ghost" onClick={onClear}>
              Clear
            </Button>
          ) : null}
          <Button className="btn-glow" disabled={!seats.length} onClick={onContinue}>
            Continue to Checkout
          </Button>
        </div>
      </div>
    </aside>
  );
}
