"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

type Team = { id: string; name: string };
type Match = {
  id: string;
  kickoffAt: string;
  stadium: string;
  country: string;
  city: string | null;
  upperSeatsTotal: number;
  closerSeatsTotal: number;
  isFeatured: boolean;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Match | null>(null);

  async function load() {
    setLoading(true);
    const [m, t] = await Promise.all([fetch("/api/admin/matches"), fetch("/api/admin/teams")]);
    const mj = await m.json();
    const tj = await t.json();
    setMatches(mj.matches || []);
    setTeams(tj.teams || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      homeTeamId: String(fd.get("homeTeamId")),
      awayTeamId: String(fd.get("awayTeamId")),
      kickoffAt: String(fd.get("kickoffAt")),
      stadium: String(fd.get("stadium")),
      country: String(fd.get("country")),
      city: String(fd.get("city") || ""),
      stadiumImageUrl: String(fd.get("stadiumImageUrl") || "/stadium-hero.svg"),
      upperSeatsTotal: Number(fd.get("upperSeatsTotal")),
      closerSeatsTotal: Number(fd.get("closerSeatsTotal")),
      isFeatured: fd.get("isFeatured") === "on",
    };

    const url = editing ? `/api/admin/matches/${editing.id}` : "/api/admin/matches";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setMessage(editing ? "Match updated" : "Match created");
    setEditing(null);
    e.currentTarget.reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this match?")) return;
    await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <Spinner label="Loading matches..." />;

  return (
    <div className="space-y-8 page-enter">
      <div>
        <h1 className="font-display text-5xl">Match Management</h1>
        <p className="text-[var(--ink-muted)]">Add, edit, and delete fixtures. Expired matches auto-complete.</p>
      </div>
      {message ? <Notify tone="success">{message}</Notify> : null}

      <form onSubmit={onSubmit} className="glass grid gap-4 rounded-2xl p-5 md:grid-cols-2">
        <Select id="homeTeamId" name="homeTeamId" label="Home team" required defaultValue={editing?.homeTeam.id}>
          <option value="">Select</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select id="awayTeamId" name="awayTeamId" label="Away team" required defaultValue={editing?.awayTeam.id}>
          <option value="">Select</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Input
          id="kickoffAt"
          name="kickoffAt"
          type="datetime-local"
          label="Kickoff"
          required
          defaultValue={
            editing
              ? new Date(editing.kickoffAt).toISOString().slice(0, 16)
              : undefined
          }
        />
        <Input id="stadium" name="stadium" label="Stadium" required defaultValue={editing?.stadium} />
        <Input id="country" name="country" label="Country" required defaultValue={editing?.country} />
        <Input id="city" name="city" label="City" defaultValue={editing?.city || ""} />
        <Input
          id="stadiumImageUrl"
          name="stadiumImageUrl"
          label="Stadium image URL"
          defaultValue="/stadium-hero.svg"
        />
        <Input
          id="upperSeatsTotal"
          name="upperSeatsTotal"
          type="number"
          label="Upper seats total"
          required
          defaultValue={editing?.upperSeatsTotal ?? 200}
        />
        <Input
          id="closerSeatsTotal"
          name="closerSeatsTotal"
          type="number"
          label="Closer seats total"
          required
          defaultValue={editing?.closerSeatsTotal ?? 160}
        />
        <label className="flex items-center gap-2 text-sm text-[var(--ink-muted)] md:col-span-2">
          <input type="checkbox" name="isFeatured" defaultChecked={editing?.isFeatured} />
          Featured match
        </label>
        <div className="flex gap-3 md:col-span-2">
          <Button type="submit" variant="gold">
            {editing ? "Update Match" : "Add Match"}
          </Button>
          {editing ? (
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="glass flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">
                {m.homeTeam.name} vs {m.awayTeam.name}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                {new Date(m.kickoffAt).toLocaleString()} · {m.stadium}, {m.country} · {m.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(m)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => remove(m.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
