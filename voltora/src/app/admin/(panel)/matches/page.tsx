"use client";

import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw, Save } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

type Match = { id: string; round: string; homeTeam: string; awayTeam: string; kickoffAt: string; status: string; isVisible: boolean; venueId: string; venue: { name: string; city: string }; _count: { listings: number; bookings: number } };
type Venue = { id: string; name: string; city: string };

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    try {
      const data = await adminFetch<{ matches: Match[]; venues: Venue[] }>("/api/admin/matches");
      setMatches(data.matches); setVenues(data.venues);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load matches"); }
  };
  useEffect(() => { void load(); }, []);
  async function save(match: Match) {
    setSaving(match.id); setError(""); setNotice("");
    try {
      await adminFetch("/api/admin/matches", { method: "POST", body: JSON.stringify({ id: match.id, round: match.round, homeTeam: match.homeTeam, awayTeam: match.awayTeam, kickoffAt: new Date(match.kickoffAt).toISOString(), venueId: match.venueId, status: match.status, isVisible: match.isVisible }) });
      setNotice("Match updated. Customer sales visibility now reflects this status.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save match"); } finally { setSaving(""); }
  }
  return <div className="space-y-6">
    <div className="flex items-end justify-between"><div><h1 className="font-display text-2xl font-bold text-white">Match management</h1><p className="mt-1 text-sm text-[#8b9cb8]">Provider-backed fixtures, overrides, visibility, and status.</p></div><button onClick={load} className="rounded-lg border border-[#294139] p-2 text-[#9db2aa]" aria-label="Refresh matches"><RefreshCw className="h-4 w-4" /></button></div>
    {error ? <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}{notice ? <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p> : null}
    <div className="space-y-3">{matches.map((match, index) => <div key={match.id} className="rounded-xl border border-[#20352d] bg-[#0f251d] p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_.8fr_.8fr_auto] lg:items-end">
        <label><span className="mb-1 block text-xs text-[#82978f]">Home team</span><input className="w-full rounded-lg border border-[#294139] bg-[#071b13] px-3 py-2 text-sm text-white" value={match.homeTeam} onChange={(event) => setMatches((rows) => rows.map((row, i) => i === index ? { ...row, homeTeam: event.target.value } : row))} /></label>
        <label><span className="mb-1 block text-xs text-[#82978f]">Away team</span><input className="w-full rounded-lg border border-[#294139] bg-[#071b13] px-3 py-2 text-sm text-white" value={match.awayTeam} onChange={(event) => setMatches((rows) => rows.map((row, i) => i === index ? { ...row, awayTeam: event.target.value } : row))} /></label>
        <label><span className="mb-1 block text-xs text-[#82978f]">Status</span><select className="w-full rounded-lg border border-[#294139] bg-[#071b13] px-3 py-2 text-sm" value={match.status} onChange={(event) => setMatches((rows) => rows.map((row, i) => i === index ? { ...row, status: event.target.value } : row))}>{["SCHEDULED","TIMED","POSTPONED","IN_PLAY","FINISHED","CANCELLED"].map((status) => <option key={status}>{status}</option>)}</select></label>
        <label><span className="mb-1 block text-xs text-[#82978f]">Customer sales</span><select className="w-full rounded-lg border border-[#294139] bg-[#071b13] px-3 py-2 text-sm" value={match.isVisible ? "visible" : "hidden"} onChange={(event) => setMatches((rows) => rows.map((row, i) => i === index ? { ...row, isVisible: event.target.value === "visible" } : row))}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label>
        <button onClick={() => save(match)} disabled={saving === match.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#35e89b] px-4 py-2 text-sm font-bold text-[#062017] disabled:opacity-50"><Save className="h-4 w-4" /> Save</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#788e85]"><span className="inline-flex gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {new Date(match.kickoffAt).toLocaleString()}</span><span>{match.round}</span><span>{match.venue.name}, {match.venue.city}</span><span>{match._count.listings} listings</span><span>{match._count.bookings} orders</span></div>
    </div>)}</div>
    <p className="text-xs text-[#758a82]">Scheduled sync: call <code>/api/cron/sync-matches</code> with the configured cron bearer secret. Provider failures do not delete stored matches or orders.</p>
  </div>;
}
