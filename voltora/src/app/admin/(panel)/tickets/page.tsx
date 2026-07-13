"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatMoney } from "@/lib/utils";

type Match = { id: string; homeTeam: string; awayTeam: string; kickoffAt: string };
type Listing = { id: string; matchId: string; category: string; section: string; row: string | null; exactSeats: string | null; quantityTotal: number; quantityAvailable: number; quantityReserved: number; quantitySold: number; price: number; currency: string; ticketType: string; deliveryMethod: string; notes: string | null; restrictions: string | null; seatsTogether: boolean; allowedQuantities: string; mapZone: string; isActive: boolean; match: Match };
const empty = { matchId: "", category: "Category 1", section: "", row: "", exactSeats: "", quantityTotal: 2, quantityAvailable: 2, price: 500, currency: "USD", ticketType: "Reserved seat", deliveryMethod: "E-ticket / PDF", notes: "", restrictions: "", seatsTogether: true, allowedQuantities: "[]", mapZone: "SIDELINE", isActive: true };

export default function AdminTicketsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function load() { const data = await adminFetch<{ listings: Listing[]; matches: Match[] }>("/api/admin/tickets"); setListings(data.listings); setMatches(data.matches); setForm((value) => ({ ...value, matchId: value.matchId || data.matches[0]?.id || "" })); }
  useEffect(() => { void load().catch((cause) => setError(cause.message)); }, []);
  async function save() {
    setError(""); setNotice("");
    try {
      await adminFetch("/api/admin/tickets", { method: "POST", body: JSON.stringify({ ...form, row: form.row || null, exactSeats: form.exactSeats || null, notes: form.notes || null, restrictions: form.restrictions || null }) });
      setNotice("Ticket listing created and available inventory updated."); setForm({ ...empty, matchId: form.matchId }); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save listing"); }
  }
  return <div className="space-y-7">
    <div><h1 className="font-display text-2xl font-bold text-white">Ticket inventory</h1><p className="mt-1 text-sm text-[#8b9cb8]">Exact seats and category allocations remain fully admin-controlled.</p></div>
    <section className="rounded-xl border border-[#20352d] bg-[#0f251d] p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Plus className="h-4 w-4 text-[#35e89b]" /> Add listing</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Field label="Match"><select value={form.matchId} onChange={(e) => setForm({ ...form, matchId: e.target.value })} className="admin-input">{matches.map((match) => <option key={match.id} value={match.id}>{match.homeTeam} vs {match.awayTeam}</option>)}</select></Field>
        <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-input" /></Field>
        <Field label="Section"><input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="admin-input" placeholder="Lower Sideline" /></Field>
        <Field label="Row"><input value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} className="admin-input" placeholder="8 or assigned later" /></Field>
        <Field label="Seats / range"><input value={form.exactSeats} onChange={(e) => setForm({ ...form, exactSeats: e.target.value })} className="admin-input" placeholder="14–19" /></Field>
        <Field label="Map zone"><select value={form.mapZone} onChange={(e) => setForm({ ...form, mapZone: e.target.value })} className="admin-input">{["SIDELINE","CORNER","UPPER","CLUB"].map((zone) => <option key={zone}>{zone}</option>)}</select></Field>
        <Field label="Total quantity"><input type="number" min="1" value={form.quantityTotal} onChange={(e) => setForm({ ...form, quantityTotal: Number(e.target.value), quantityAvailable: Number(e.target.value) })} className="admin-input" /></Field>
        <Field label="Price per ticket"><input type="number" min="1" step=".01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="admin-input" /></Field>
        <Field label="Currency"><input maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} className="admin-input" /></Field>
        <Field label="Ticket type"><input value={form.ticketType} onChange={(e) => setForm({ ...form, ticketType: e.target.value })} className="admin-input" /></Field>
        <Field label="Delivery method"><input value={form.deliveryMethod} onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })} className="admin-input" /></Field>
        <Field label="Allowed quantities JSON"><input value={form.allowedQuantities} onChange={(e) => setForm({ ...form, allowedQuantities: e.target.value })} className="admin-input" placeholder="[2,4]" /></Field>
      </div>
      <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="admin-input mt-1 min-h-20" /></Field>
      <label className="mt-4 flex items-center gap-2 text-sm text-[#b5c5be]"><input type="checkbox" checked={form.seatsTogether} onChange={(e) => setForm({ ...form, seatsTogether: e.target.checked })} /> Seats must remain together</label>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}{notice ? <p className="mt-4 text-sm text-emerald-300">{notice}</p> : null}
      <button onClick={save} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#35e89b] px-5 py-2.5 text-sm font-bold text-[#062017]"><Save className="h-4 w-4" /> Create listing</button>
    </section>
    <section><h2 className="mb-3 font-display text-lg font-bold">Current listings</h2><div className="overflow-x-auto rounded-xl border border-[#20352d]"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#102b20] text-xs uppercase text-[#82978f]"><tr>{["Match","Category / section","Inventory","Price","Delivery","Status"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody>{listings.map((item) => <tr key={item.id} className="border-t border-[#20352d] bg-[#0c2119]"><td className="px-4 py-3">{item.match.homeTeam} vs {item.match.awayTeam}</td><td className="px-4 py-3"><span className="font-semibold">{item.category}</span><br/><span className="text-xs text-[#7e938a]">{item.section}{item.row ? ` · Row ${item.row}` : ""}</span></td><td className="px-4 py-3"><span className="text-emerald-300">{item.quantityAvailable} available</span><br/><span className="text-xs text-[#7e938a]">{item.quantityReserved} held · {item.quantitySold} sold</span></td><td className="px-4 py-3 font-semibold">{formatMoney(item.price, item.currency)}</td><td className="px-4 py-3">{item.deliveryMethod}</td><td className="px-4 py-3">{item.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div></section>
    <style jsx>{`.admin-input{width:100%;border:1px solid #294139;background:#071b13;border-radius:8px;padding:.6rem .75rem;color:white;font-size:.875rem}.admin-input:focus{outline:2px solid #35e89b55;border-color:#35e89b}`}</style>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-4 block"><span className="mb-1 block text-xs text-[#82978f]">{label}</span>{children}</label>; }
