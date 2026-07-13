"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Armchair, Check, Info, Loader2, MapPin, Users } from "lucide-react";
import { formatMoney, parseJsonArray } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Listing = {
  id: string;
  category: string;
  section: string;
  row: string | null;
  exactSeats: string | null;
  quantityAvailable: number;
  price: number;
  currency: string;
  ticketType: string;
  deliveryMethod: string;
  notes: string | null;
  restrictions: string | null;
  seatsTogether: boolean;
  allowedQuantities: string;
  mapZone: string;
};

export function TicketMarketplace({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [zone, setZone] = useState("ALL");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => listings.filter((item) => zone === "ALL" || item.mapZone === zone), [listings, zone]);

  function choose(item: Listing) {
    setSelected(item);
    const allowed = parseJsonArray(item.allowedQuantities).map(Number).filter((value) => value <= item.quantityAvailable);
    setQuantity(allowed[0] || 1);
    setError("");
  }

  async function reserve() {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tickets/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: selected.id, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reserve tickets");
      sessionStorage.setItem("pitchpass_reservation", JSON.stringify(data.reservation));
      router.push(`/checkout?reservation=${encodeURIComponent(data.reservation.token)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reserve tickets");
      setLoading(false);
    }
  }

  const zones = [
    ["ALL", "All tickets"],
    ["SIDELINE", "Sideline"],
    ["CORNER", "Corners"],
    ["UPPER", "Upper level"],
    ["CLUB", "Club"],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-[28px] border border-[#dbe8e1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h2 className="font-display text-xl font-bold">Stadium view</h2><p className="mt-1 text-xs text-[var(--ink-muted)]">Approximate seating reference</p></div>
            <Info className="h-4 w-4 text-[#7a9187]" />
          </div>
          <div className="relative mt-5 aspect-[4/3] rounded-[28%] bg-[#dcece4] p-[13%] shadow-inner">
            <button type="button" onClick={() => setZone("UPPER")} className={cn("absolute inset-[4%] rounded-[28%] border-[14px] border-[#b7d2c4] transition", zone === "UPPER" && "!border-[#35e89b]")} aria-label="Filter upper level" />
            <button type="button" onClick={() => setZone("CORNER")} className={cn("absolute inset-[16%] rounded-[24%] border-[12px] border-[#8db5a1] transition", zone === "CORNER" && "!border-[#35e89b]")} aria-label="Filter corner seating" />
            <button type="button" onClick={() => setZone("SIDELINE")} className={cn("absolute inset-x-[24%] inset-y-[20%] border-x-[12px] border-[#578f73] transition", zone === "SIDELINE" && "!border-[#35e89b]")} aria-label="Filter sideline seating" />
            <button type="button" onClick={() => setZone("CLUB")} className={cn("absolute inset-x-[32%] inset-y-[25%] border-x-[8px] border-[#e1b95e] transition", zone === "CLUB" && "!border-[#35e89b]")} aria-label="Filter club seating" />
            <div className="relative z-10 h-full rounded-lg bg-[#238557] p-2 [background-image:linear-gradient(90deg,transparent_49%,rgba(255,255,255,.7)_50%,transparent_51%)]">
              <div className="h-full rounded-md border border-white/60" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {zones.map(([value, label]) => (
              <button key={value} type="button" onClick={() => setZone(value)} className={cn("rounded-full border px-3 py-2 text-xs font-semibold transition", zone === value ? "border-[#143e2f] bg-[#143e2f] text-white" : "border-[#dce8e2] bg-white text-[#587067] hover:border-[#9bb9aa]")}>{label}</button>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[#778d84]">This diagram indicates approximate categories only and is not an official venue seat map. Views and layouts vary by stadium.</p>
        </div>
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-2xl font-bold">Available tickets</h2><p className="mt-1 text-sm text-[var(--ink-muted)]">{filtered.length} active listings</p></div></div>
        <div className="space-y-3">
          {filtered.map((item) => {
            const active = selected?.id === item.id;
            return (
              <button key={item.id} type="button" onClick={() => choose(item)} className={cn("w-full rounded-[22px] border bg-white p-5 text-left shadow-sm transition hover:border-[#78ad93]", active ? "border-[#1aa56c] ring-2 ring-[#35e89b]/25" : "border-[#dce8e2]")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e7f7ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#14704d]">{item.category}</span>{active ? <span className="inline-flex items-center gap-1 text-xs font-bold text-[#14704d]"><Check className="h-3.5 w-3.5" /> Selected</span> : null}</div>
                    <h3 className="mt-3 font-display text-lg font-bold">{item.section}</h3>
                    <p className="mt-1 text-xs text-[#687f75]">{item.row ? `Row ${item.row}` : "Row assigned later"} · {item.exactSeats ? `Seats ${item.exactSeats}` : "Exact seats assigned later"}</p>
                  </div>
                  <div className="text-right"><p className="font-display text-xl font-extrabold">{formatMoney(item.price, item.currency)}</p><p className="text-[10px] uppercase tracking-wider text-[#7c9188]">per ticket</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#edf2ef] pt-4 text-xs text-[#5e756b]">
                  <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {item.seatsTogether ? "Seats together" : "May be split"}</span>
                  <span className="flex items-center gap-1.5"><Armchair className="h-3.5 w-3.5" /> {item.quantityAvailable} available</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {item.deliveryMethod}</span>
                </div>
                {active && item.notes ? <p className="mt-3 rounded-xl bg-[#f6f9f7] p-3 text-xs leading-5 text-[#587067]">{item.notes}</p> : null}
              </button>
            );
          })}
          {!filtered.length ? <div className="rounded-2xl border border-dashed border-[#b9cec3] p-10 text-center text-sm text-[var(--ink-muted)]">No active listings in this area.</div> : null}
        </div>
        {selected ? (
          <div className="sticky bottom-4 mt-5 rounded-[24px] border border-[#234d3d] bg-[#081f16] p-4 text-white shadow-2xl sm:flex sm:items-center sm:justify-between">
            <div><p className="text-xs text-white/50">{selected.category} · {selected.section}</p><p className="mt-1 font-display text-lg font-bold">{formatMoney(selected.price * quantity, selected.currency)} <span className="text-xs font-normal text-white/50">ticket subtotal</span></p></div>
            <div className="mt-4 flex items-center gap-3 sm:mt-0">
              <label className="sr-only" htmlFor="ticket-quantity">Quantity</label>
              <select id="ticket-quantity" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white">
                {(parseJsonArray(selected.allowedQuantities).length ? parseJsonArray(selected.allowedQuantities).map(Number) : Array.from({ length: Math.min(10, selected.quantityAvailable) }, (_, index) => index + 1)).filter((value) => value <= selected.quantityAvailable).map((value) => <option key={value} value={value} className="text-black">{value} {value === 1 ? "ticket" : "tickets"}</option>)}
              </select>
              <button type="button" onClick={reserve} disabled={loading} className="btn flex-1 bg-[var(--brand)] px-5 py-3 font-bold text-[#062017] sm:flex-none">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}</button>
            </div>
            {error ? <p className="mt-3 text-xs text-red-300 sm:absolute sm:-top-8 sm:right-0">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
