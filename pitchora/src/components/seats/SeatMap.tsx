"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { SelectedSeat } from "@/store/booking";

export type SeatData = {
  id: string;
  section: string;
  row: string;
  number: number;
  category: "UPPER" | "CLOSER";
  status: string;
};

export function SeatMap({
  seats,
  selectedIds,
  onToggle,
  categoryFilter,
}: {
  seats: SeatData[];
  selectedIds: string[];
  onToggle: (seat: SelectedSeat) => void;
  categoryFilter: "UPPER" | "CLOSER";
}) {
  const filtered = useMemo(
    () => seats.filter((s) => s.category === categoryFilter),
    [seats, categoryFilter]
  );

  const sections = useMemo(() => {
    const map = new Map<string, Map<string, SeatData[]>>();
    for (const seat of filtered) {
      if (!map.has(seat.section)) map.set(seat.section, new Map());
      const rows = map.get(seat.section)!;
      if (!rows.has(seat.row)) rows.set(seat.row, []);
      rows.get(seat.row)!.push(seat);
    }
    for (const rows of map.values()) {
      for (const list of rows.values()) list.sort((a, b) => a.number - b.number);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-gradient-to-b from-emerald-950/40 to-black/60 p-4 md:p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-3 w-2/3 max-w-md rounded-full bg-[var(--emerald)]/30" />
          <p className="font-display text-2xl tracking-widest text-[var(--emerald)]">PITCH</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map(([section, rows]) => (
            <div key={section} className="rounded-xl border border-white/5 bg-black/30 p-3">
              <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                Section {section}
              </p>
              <div className="space-y-1.5">
                {Array.from(rows.entries()).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-right text-[10px] text-[var(--ink-muted)]">{row}</span>
                    <div className="flex flex-wrap gap-1">
                      {rowSeats.map((seat) => {
                        const selected = selectedIds.includes(seat.id);
                        const status = selected ? "SELECTED" : seat.status;
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            title={`${seat.section} Row ${seat.row} Seat ${seat.number}`}
                            disabled={seat.status !== "AVAILABLE" && !selected}
                            onClick={() =>
                              onToggle({
                                id: seat.id,
                                section: seat.section,
                                row: seat.row,
                                number: seat.number,
                                category: seat.category,
                              })
                            }
                            className={cn(
                              "seat",
                              status === "AVAILABLE" && "seat-available",
                              status === "SELECTED" && "seat-selected",
                              status === "RESERVED" && "seat-reserved",
                              status === "SOLD" && "seat-sold"
                            )}
                            aria-label={`Seat ${seat.section}-${seat.row}-${seat.number}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
        <Legend color="bg-[#10b981]" label="Available" />
        <Legend color="bg-[#fbbf24]" label="Selected" />
        <Legend color="bg-[#d4d4d8]" label="Reserved" />
        <Legend color="bg-[#ef4444]" label="Sold" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
