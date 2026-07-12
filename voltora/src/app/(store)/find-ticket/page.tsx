"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatMatchDate, formatMatchTime } from "@/lib/format";
import { useChat } from "@/components/providers/ChatProvider";

export default function FindTicketPage() {
  const { openWithContext } = useChat();
  const [orderNumber, setOrderNumber] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/tickets/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          accessCode,
          email: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setOrder(data.order);
      sessionStorage.setItem(
        "arenanights_order",
        JSON.stringify({
          orderNumber: data.order.orderNumber,
          accessCode,
          paymentUrl: "",
          buttonText: "",
          totalFormatted: data.order.totalFormatted,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-xl">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Find My Ticket
        </div>
        <h1 className="mt-2 font-display text-5xl text-white">Retrieve Your Booking</h1>
        <p className="mt-3 text-sm text-white/60">
          Enter your order ID and secure access code. Order numbers alone are not enough.
        </p>

        <form onSubmit={submit} className="glass-panel mt-6 space-y-3 p-5">
          <Input
            label="Order ID"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            required
          />
          <Input
            label="Access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            required
          />
          <Input
            label="Email (optional extra check)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          <Button type="submit" fullWidth loading={loading}>
            Look Up Booking
          </Button>
        </form>

        {order ? (
          <div className="glass-panel mt-6 space-y-4 p-5 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="font-display text-3xl text-white">{order.orderNumber}</div>
              <span className="badge badge-neutral">{order.status}</span>
            </div>
            <div className="text-sm text-white/70">
              {order.match.teamAName} vs {order.match.teamBName}
              <br />
              {formatMatchDate(order.match.matchDate)} · {formatMatchTime(order.match.matchDate)}
              <br />
              Payment: {order.paymentStatus} · Tickets: {order.ticketStatus}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {order.tickets?.length ? (
                <Link
                  href={`/order/${order.orderNumber}/tickets?accessCode=${encodeURIComponent(accessCode)}`}
                  className="btn btn-primary flex-1"
                >
                  Download QR Pass
                </Link>
              ) : (
                <Link href={`/order/${order.orderNumber}/pay`} className="btn btn-secondary flex-1">
                  Continue Payment
                </Link>
              )}
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() =>
                  openWithContext({
                    message: `I need help with order ${order.orderNumber}.`,
                    subject: "Ticket delivery support",
                  })
                }
              >
                Contact Support
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
