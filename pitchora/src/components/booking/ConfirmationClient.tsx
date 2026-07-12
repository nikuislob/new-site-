"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  ticketCategory: string;
  quantity: number;
  seatLabels: string;
  originalTotal: number;
  paymentAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentLinkUsed: string | null;
  qrPayload: string;
  match: {
    kickoffAt: string;
    stadium: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
  };
};

export function ConfirmationClient({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order not found");
      setOrder(data.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function confirmPayment() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm-payment" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  }

  function downloadTicket() {
    if (!order) return;
    const content = `Pitchora Ticket\nOrder: ${order.orderNumber}\nMatch: ${order.match.homeTeam.name} vs ${order.match.awayTeam.name}\nStadium: ${order.match.stadium}\nSeats: ${order.seatLabels}\nQuantity: ${order.quantity}\nPaid: ${order.paymentAmount}\nStatus: ${order.paymentStatus}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Spinner label="Loading confirmation..." />;
  if (error || !order) return <Notify tone="error">{error || "Order not found"}</Notify>;

  const showPay = searchParams.get("pay") === "1" && order.paymentStatus === "PENDING";

  return (
    <div className="mx-auto max-w-3xl space-y-6 page-enter">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--emerald)]">Order Confirmation</p>
        <h1 className="font-display text-5xl md:text-6xl">You&apos;re almost match-ready</h1>
        <p className="mt-2 text-[var(--ink-muted)]">Order ID: {order.orderNumber}</p>
      </div>

      {showPay ? (
        <div className="glass space-y-4 rounded-[var(--radius)] p-6">
          <Notify tone="info">
            Complete payment using the configured {order.paymentMethod === "APPLE_PAY" ? "Apple Pay" : "Cash App"} link.
            Amount due: <strong>{formatCurrency(order.paymentAmount)}</strong>
            {order.paymentAmount !== order.originalTotal
              ? ` (ticket total ${formatCurrency(order.originalTotal)} + unique verification amount)`
              : ""}
            .
          </Notify>
          {order.paymentLinkUsed ? (
            <a href={order.paymentLinkUsed} target="_blank" rel="noreferrer">
              <Button variant="gold" className="w-full sm:w-auto">
                Open {order.paymentMethod === "APPLE_PAY" ? "Apple Pay" : "Cash App"} Link
              </Button>
            </a>
          ) : null}
          <Button variant="secondary" onClick={confirmPayment} disabled={confirming}>
            {confirming ? "Confirming..." : "I've Completed Payment"}
          </Button>
        </div>
      ) : null}

      <div className="glass grid gap-6 rounded-[var(--radius)] p-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-[var(--ink-muted)]">Match:</span> {order.match.homeTeam.name} vs{" "}
            {order.match.awayTeam.name}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Stadium:</span> {order.match.stadium}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Kickoff:</span>{" "}
            {new Date(order.match.kickoffAt).toLocaleString()}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Seats:</span> {order.seatLabels}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Category:</span> {order.ticketCategory}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Guest:</span> {order.customerName} ({order.customerEmail})
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Ticket total:</span> {formatCurrency(order.originalTotal)}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Payment amount:</span> {formatCurrency(order.paymentAmount)}
          </p>
          <p>
            <span className="text-[var(--ink-muted)]">Status:</span>{" "}
            <span className={order.paymentStatus === "PAID" ? "text-[var(--emerald)]" : "text-[var(--warning)]"}>
              {order.paymentStatus}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-black">
          <QRCodeSVG value={order.qrPayload} size={140} />
          <p className="text-xs font-medium">QR Ticket</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button variant="gold" onClick={() => window.print()}>
          Print Ticket
        </Button>
        <Button variant="secondary" onClick={downloadTicket}>
          Download Ticket
        </Button>
        <Link href="/matches">
          <Button variant="ghost">Browse More Matches</Button>
        </Link>
      </div>
    </div>
  );
}
