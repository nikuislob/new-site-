"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";

type SeatRow = {
  id: string;
  section: string;
  block: string;
  row: string;
  number: number;
  category: string;
  price: number;
  status: string;
  holdExpiresAt: string | null;
  match: { homeTeam: { shortName: string }; awayTeam: { shortName: string }; stadium: string };
};

type MatchOpt = { id: string; label: string };

export default function AdminSeatsPage() {
  const [seats, setSeats] = useState<SeatRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<MatchOpt[]>([]);
  const [matchId, setMatchId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextMatch = matchId, nextStatus = status) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextMatch) params.set("matchId", nextMatch);
    if (nextStatus) params.set("status", nextStatus);
    const [s, m] = await Promise.all([
      fetch(`/api/admin/seats?${params}`),
      fetch("/api/admin/matches"),
    ]);
    const sj = await s.json();
    const mj = await m.json();
    setSeats(sj.seats || []);
    setCounts(sj.counts || {});
    setMatches(
      (mj.matches || []).map(
        (x: { id: string; homeTeam: { name: string }; awayTeam: { name: string } }) => ({
          id: x.id,
          label: `${x.homeTeam.name} vs ${x.awayTeam.name}`,
        })
      )
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="font-display text-5xl">Seat Inventory</h1>
        <p className="text-[var(--ink-muted)]">Real stadium seats — available, held, and sold.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {["AVAILABLE", "HELD", "SOLD", "UNAVAILABLE"].map((k) => (
          <div key={k} className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--ink-muted)]">{k}</p>
            <p className="font-display text-3xl text-[var(--gold)]">{counts[k] || 0}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <Select id="match" label="Match" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
          <option value="">All matches</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <Select id="status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="HELD">HELD</option>
          <option value="SOLD">SOLD</option>
        </Select>
        <div className="flex items-end">
          <button className="btn rounded-full bg-[var(--gold)] px-5 py-3 font-semibold text-black" onClick={() => load()}>
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-3">Match</th>
                <th className="px-3 py-3">Section</th>
                <th className="px-3 py-3">Block</th>
                <th className="px-3 py-3">Row</th>
                <th className="px-3 py-3">Seat</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {seats.map((s) => (
                <tr key={s.id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-3">
                    {s.match.homeTeam.shortName} vs {s.match.awayTeam.shortName}
                  </td>
                  <td className="px-3 py-3">{s.section}</td>
                  <td className="px-3 py-3">{s.block}</td>
                  <td className="px-3 py-3">{s.row}</td>
                  <td className="px-3 py-3">{s.number}</td>
                  <td className="px-3 py-3">{s.category}</td>
                  <td className="px-3 py-3">{formatCurrency(s.price)}</td>
                  <td className="px-3 py-3">
                    {s.status}
                    {s.status === "HELD" && s.holdExpiresAt
                      ? ` · until ${new Date(s.holdExpiresAt).toLocaleTimeString()}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
