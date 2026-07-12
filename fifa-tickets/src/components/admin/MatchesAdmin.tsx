"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMatchDate } from "@/lib/utils";

type MatchRow = {
  id: string;
  slug: string;
  homeTeam: string;
  opponent: string;
  venue: string;
  stadiumName: string;
  stadiumImage: string | null;
  matchDate: string;
  matchTime: string;
  description: string | null;
  isPublished: boolean;
  _count: { seats: number; orders: number };
};

export function MatchesAdmin({ initialMatches }: { initialMatches: MatchRow[] }) {
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MatchRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/matches");
    const data = await res.json();
    if (res.ok) setMatches(data.matches);
    router.refresh();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      homeTeam: fd.get("homeTeam"),
      opponent: fd.get("opponent"),
      venue: fd.get("venue"),
      stadiumName: fd.get("stadiumName"),
      stadiumImage: fd.get("stadiumImage") || null,
      matchDate: fd.get("matchDate"),
      matchTime: fd.get("matchTime"),
      description: fd.get("description") || null,
      isPublished: fd.get("isPublished") === "on",
    };

    const res = await fetch(editing ? `/api/admin/matches/${editing.id}` : "/api/admin/matches", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setShowForm(false);
    setEditing(null);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this match and its seats/orders?")) return;
    await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    await refresh();
  }

  function openEdit(m: MatchRow) {
    setEditing(m);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Matches</h1>
          <p className="text-sm text-[var(--ink-muted)]">CRUD for fixtures, venues, and stadium imagery</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          Add Match
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl">{editing ? "Edit Match" : "New Match"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="field">
              <label>Home team</label>
              <input name="homeTeam" defaultValue={editing?.homeTeam || "FIFA Select"} required />
            </div>
            <div className="field">
              <label>Opponent</label>
              <input name="opponent" defaultValue={editing?.opponent || ""} required />
            </div>
            <div className="field">
              <label>Venue / City</label>
              <input name="venue" defaultValue={editing?.venue || ""} required />
            </div>
            <div className="field">
              <label>Stadium name</label>
              <input name="stadiumName" defaultValue={editing?.stadiumName || ""} required />
            </div>
            <div className="field">
              <label>Stadium image URL</label>
              <input
                name="stadiumImage"
                defaultValue={editing?.stadiumImage || "/images/stadium-metlife.svg"}
              />
            </div>
            <div className="field">
              <label>Match date</label>
              <input
                name="matchDate"
                type="date"
                defaultValue={editing ? editing.matchDate.slice(0, 10) : ""}
                required
              />
            </div>
            <div className="field">
              <label>Kickoff time</label>
              <input name="matchTime" defaultValue={editing?.matchTime || "19:00"} required />
            </div>
            <div className="field sm:col-span-2">
              <label>Description</label>
              <textarea name="description" rows={3} defaultValue={editing?.description || ""} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="isPublished" defaultChecked={editing?.isPublished ?? true} />
              Published
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--ink-muted)]">
            <tr>
              <th className="px-4 py-3">Fixture</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Stadium</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-b border-[var(--line)]/50">
                <td className="px-4 py-3 font-semibold">
                  {m.homeTeam} vs {m.opponent}
                </td>
                <td className="px-4 py-3">
                  {formatMatchDate(m.matchDate)} · {m.matchTime}
                </td>
                <td className="px-4 py-3">
                  {m.stadiumName}
                  <div className="text-xs text-[var(--ink-muted)]">{m.venue}</div>
                </td>
                <td className="px-4 py-3">{m._count.seats}</td>
                <td className="px-4 py-3">{m._count.orders}</td>
                <td className="px-4 py-3">{m.isPublished ? "Published" : "Draft"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/matches/${m.slug}`} className="text-[var(--pitch)] underline">
                      View
                    </Link>
                    <button type="button" className="text-[var(--pitch)] underline" onClick={() => openEdit(m)}>
                      Edit
                    </button>
                    <Link href={`/admin/seats?matchId=${m.id}`} className="text-[var(--pitch)] underline">
                      Seats
                    </Link>
                    <button type="button" className="text-[var(--danger)] underline" onClick={() => remove(m.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
