"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMatchDate, formatMatchTime } from "@/lib/format";

export default function TicketsPage() {
  const params = useParams<{ orderNumber: string }>();
  const search = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessCode = search.get("accessCode") || "";
    if (!accessCode) {
      setError("Access code required");
      return;
    }
    fetch(`/api/orders/${params.orderNumber}?accessCode=${encodeURIComponent(accessCode)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load tickets");
        setOrder(data.order);
        if (search.get("download") === "1") {
          setTimeout(() => window.print(), 600);
        }
      })
      .catch((err) => setError(err.message));
  }, [params.orderNumber, search]);

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <div className="glass-panel mx-auto max-w-lg p-8">
          <h1 className="font-display text-4xl text-white">Tickets unavailable</h1>
          <p className="mt-3 text-white/60">{error}</p>
          <Link href="/find-ticket" className="btn btn-primary mt-6">
            Find My Ticket
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page py-20">
        <div className="skeleton mx-auto h-72 max-w-lg" />
      </div>
    );
  }

  if (!order.tickets?.length) {
    return (
      <div className="container-page py-20 text-center">
        <div className="glass-panel mx-auto max-w-lg p-8">
          <h1 className="font-display text-4xl text-white">Tickets pending</h1>
          <p className="mt-3 text-white/60">
            Tickets are generated only after payment verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="font-display text-4xl text-white">Your QR Passes</h1>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <div className="grid gap-5">
        {order.tickets.map((ticket: any) => {
          const snap = typeof ticket.matchSnapshot === "string"
            ? JSON.parse(ticket.matchSnapshot)
            : ticket.matchSnapshot || order.match;
          return (
            <article
              key={ticket.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(160deg,#0d1a2b,#071018)] shadow-2xl print:break-inside-avoid"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="font-display text-2xl tracking-[0.1em] text-white">ARENA NIGHTS</div>
                <div className="badge badge-success">{ticket.status}</div>
              </div>
              <div className="grid gap-5 p-5 md:grid-cols-[1fr_180px]">
                <div className="space-y-3">
                  <div className="font-display text-3xl text-white">
                    {snap.teamAName} vs {snap.teamBName}
                  </div>
                  <div className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Date</div>
                      {formatMatchDate(snap.matchDate || order.match.matchDate)}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Time</div>
                      {formatMatchTime(snap.matchDate || order.match.matchDate)}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Stadium</div>
                      {snap.stadiumName || order.match.stadiumName}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Category</div>
                      {ticket.categoryName}
                      {ticket.zoneName ? ` · ${ticket.zoneName}` : ""}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Holder</div>
                      {ticket.holderName}
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Ticket ID</div>
                      <span className="font-mono">{ticket.ticketNumber}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-white/45">
                    {snap.entryInstructions ||
                      "Arrive early and present this QR pass at your gate. Do not share your access code."}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ticket.qrDataUrl} alt={`QR for ${ticket.ticketNumber}`} className="h-40 w-40" />
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0a1628]">
                    Scan at entry
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
