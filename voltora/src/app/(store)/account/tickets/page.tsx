"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountTicketsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.replace("/account/login?redirect=/account/tickets");
        return;
      }
      const res = await fetch("/api/auth/orders");
      const data = await res.json();
      setOrders((data.orders || []).filter((o: any) => o.tickets?.length));
    })();
  }, [router]);

  return (
    <div className="container-page py-10">
      <Link href="/account" className="text-sm text-[var(--brand)]">
        ← Back to account
      </Link>
      <h1 className="mt-3 font-display text-5xl text-white">My Tickets</h1>
      <div className="mt-6 grid gap-4">
        {orders.length === 0 ? (
          <p className="text-white/60">No issued tickets yet.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="ticket-glow p-5">
              <div className="font-display text-2xl text-white">
                {o.match.teamAName} vs {o.match.teamBName}
              </div>
              <div className="mt-1 text-sm text-white/60">{o.tickets.length} pass(es)</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {o.tickets.map((t: any) => (
                  <div key={t.id} className="rounded-2xl bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.qrDataUrl} alt={t.ticketNumber} className="h-28 w-28" />
                    <div className="mt-1 text-center text-[10px] font-bold text-[#0a1628]">
                      {t.section ? `${t.section}-${t.row}-${t.seatNumber}` : t.ticketNumber}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/order/${o.orderNumber}/tickets?accessCode=${encodeURIComponent(o.accessCode)}`}
                className="btn btn-primary mt-4 !py-2 !text-sm"
              >
                Open full QR pass
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
