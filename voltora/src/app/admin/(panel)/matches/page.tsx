"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatMatchDate, formatMatchTime } from "@/lib/format";

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "Arena Nights Championship Final",
    teamAName: "",
    teamBName: "",
    teamACode: "",
    teamBCode: "",
    matchDate: "",
    stadiumName: "",
    city: "",
    description: "",
    salesEnabled: true,
    isFeatured: true,
  });
  const [message, setMessage] = useState<string | null>(null);

  const load = () =>
    fetch("/api/admin/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        matchDate: new Date(form.matchDate).toISOString(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setMessage("Match created");
    load();
  };

  const toggleSales = async (match: any) => {
    await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salesEnabled: !match.salesEnabled }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Matches</h1>

      <div className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        <h2 className="font-semibold text-white">Add Match</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Match date/time" type="datetime-local" value={form.matchDate} onChange={(e) => setForm({ ...form, matchDate: e.target.value })} />
          <Input label="Team A" value={form.teamAName} onChange={(e) => setForm({ ...form, teamAName: e.target.value })} />
          <Input label="Team A code" value={form.teamACode} onChange={(e) => setForm({ ...form, teamACode: e.target.value })} />
          <Input label="Team B" value={form.teamBName} onChange={(e) => setForm({ ...form, teamBName: e.target.value })} />
          <Input label="Team B code" value={form.teamBCode} onChange={(e) => setForm({ ...form, teamBCode: e.target.value })} />
          <Input label="Stadium" value={form.stadiumName} onChange={(e) => setForm({ ...form, stadiumName: e.target.value })} />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        {message ? <p className="mt-2 text-sm text-white/70">{message}</p> : null}
        <Button className="mt-4" onClick={create}>
          Create Match
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50">
            <tr>
              <th className="px-3 py-3">Match</th>
              <th className="px-3 py-3">When</th>
              <th className="px-3 py-3">Venue</th>
              <th className="px-3 py-3">Sales</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} className="border-t border-white/5">
                <td className="px-3 py-3">
                  <div className="font-semibold text-white">{m.title}</div>
                  <div className="text-white/50">
                    {m.teamAName} vs {m.teamBName}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {formatMatchDate(m.matchDate)}
                  <br />
                  {formatMatchTime(m.matchDate)}
                </td>
                <td className="px-3 py-3">
                  {m.stadiumName}, {m.city}
                </td>
                <td className="px-3 py-3">{m.salesEnabled ? "Enabled" : "Paused"}</td>
                <td className="px-3 py-3">
                  <Button variant="secondary" onClick={() => toggleSales(m)}>
                    {m.salesEnabled ? "Pause sales" : "Enable sales"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
