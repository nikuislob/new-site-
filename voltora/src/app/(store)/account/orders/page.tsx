"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { formatMatchDate } from "@/lib/format";

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.replace("/account/login?redirect=/account/orders");
        return;
      }
      const res = await fetch("/api/auth/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    })();
  }, [router]);

  return (
    <div className="container-page py-10">
      <Link href="/account" className="text-sm text-[var(--brand)]">
        ← Back to account
      </Link>
      <h1 className="mt-3 font-display text-5xl text-white">My Orders</h1>
      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <article key={o.id} className="ticket-glow p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[var(--brand)]">{o.orderNumber}</div>
                <div className="text-sm text-white/70">
                  {o.match.teamAName} vs {o.match.teamBName} · {formatMatchDate(o.match.matchDate)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">{formatCurrency(o.totalCents)}</div>
                <div className="text-xs text-white/50">
                  {o.paymentStatus} · {o.ticketStatus}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-white/60">
              {o.items?.map((i: any) => (
                <div key={i.id}>
                  {i.categoryName}
                  {i.section
                    ? ` · Sec ${i.section} Block ${i.block} Row ${i.row} Seat ${i.seatNumber}`
                    : ""}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {o.tickets?.length ? (
                <Link
                  href={`/order/${o.orderNumber}/tickets?accessCode=${encodeURIComponent(o.accessCode)}`}
                  className="btn btn-primary !py-2 !text-sm"
                >
                  Download QR Pass
                </Link>
              ) : (
                <Link href={`/order/${o.orderNumber}/pay`} className="btn btn-secondary !py-2 !text-sm">
                  Continue payment
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
