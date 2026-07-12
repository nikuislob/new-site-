"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type MatchOption = { id: string; label: string };
type Seat = {
  id: string;
  section: string;
  row: string;
  number: number;
  label: string;
  status: string;
  category: { name: string; color: string; code: string };
};

export function SeatsAdmin({ matches }: { matches: MatchOption[] }) {
  const searchParams = useSearchParams();
  const [matchId, setMatchId] = useState(searchParams.get("matchId") || matches[0]?.id || "");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load(id: string) {
      if (!id) return;
      setLoading(true);
      const res = await fetch(`/api/admin/seats?matchId=${id}`);
      const data = await res.json();
      if (cancelled) return;
      if (res.ok) setSeats(data.seats);
      setSelected([]);
      setLoading(false);
    }
    load(matchId);
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const sections = useMemo(() => {
    const map = new Map<string, Seat[]>();
    for (const s of seats) {
      const list = map.get(s.section) ?? [];
      list.push(s);
      map.set(s.section, list);
    }
    return Array.from(map.entries());
  }, [seats]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function setStatus(status: "AVAILABLE" | "HELD" | "SOLD") {
    if (!selected.length) return;
    await fetch("/api/admin/seats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatIds: selected, status }),
    });
    const res = await fetch(`/api/admin/seats?matchId=${matchId}`);
    const data = await res.json();
    if (res.ok) setSeats(data.seats);
    setSelected([]);
  }

  const counts = {
    available: seats.filter((s) => s.status === "AVAILABLE").length,
    sold: seats.filter((s) => s.status === "SOLD").length,
    held: seats.filter((s) => s.status === "HELD").length,
  };

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Seat Inventory</h1>
      <p className="text-sm text-[var(--ink-muted)]">Visual seat map — select seats and update availability</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="field min-w-[260px]">
          <label>Match</label>
          <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-outline" disabled={!selected.length} onClick={() => setStatus("AVAILABLE")}>
          Mark Available
        </button>
        <button type="button" className="btn btn-outline" disabled={!selected.length} onClick={() => setStatus("HELD")}>
          Mark Held
        </button>
        <button type="button" className="btn btn-danger" disabled={!selected.length} onClick={() => setStatus("SOLD")}>
          Mark Sold
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span>Available: <strong>{counts.available}</strong></span>
        <span>Sold: <strong>{counts.sold}</strong></span>
        <span>Held: <strong>{counts.held}</strong></span>
        <span>Selected: <strong>{selected.length}</strong></span>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        {loading ? (
          <p>Loading seats…</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl bg-[var(--pitch)] py-3 text-center text-sm font-semibold text-white">
              Pitch
            </div>
            {sections.map(([section, sectionSeats]) => {
              const rows = Array.from(new Set(sectionSeats.map((s) => s.row))).sort();
              return (
                <div key={section}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                    Section {section}
                  </p>
                  <div className="space-y-1.5">
                    {rows.map((row) => (
                      <div key={row} className="flex items-center gap-2">
                        <span className="w-5 text-xs font-bold">{row}</span>
                        <div className="flex flex-wrap gap-1">
                          {sectionSeats
                            .filter((s) => s.row === row)
                            .sort((a, b) => a.number - b.number)
                            .map((seat) => {
                              const isSel = selected.includes(seat.id);
                              return (
                                <button
                                  key={seat.id}
                                  type="button"
                                  title={`${seat.label} · ${seat.category.name} · ${seat.status}`}
                                  onClick={() => toggle(seat.id)}
                                  className={`h-7 w-7 rounded text-[9px] font-bold ${
                                    isSel
                                      ? "ring-2 ring-[var(--gold)]"
                                      : ""
                                  } ${
                                    seat.status === "AVAILABLE"
                                      ? "bg-[var(--pitch-soft)] text-[var(--pitch-deep)]"
                                      : seat.status === "SOLD"
                                        ? "bg-[#d7dde0] text-[#777]"
                                        : "bg-[#fff4e5] text-[#8a4b08]"
                                  }`}
                                  style={{ borderTop: `3px solid ${seat.category.color}` }}
                                >
                                  {seat.number}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
