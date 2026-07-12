"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/components/providers/ChatProvider";

type StoredOrder = {
  orderNumber: string;
  accessCode: string;
  paymentUrl: string;
  buttonText: string;
  instructions?: string;
  reservationExpiresAt?: string | null;
  totalFormatted: string;
};

export default function PayOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const { openWithContext } = useChat();
  const [stored, setStored] = useState<StoredOrder | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("arenanights_order");
    if (raw) {
      const parsed = JSON.parse(raw) as StoredOrder;
      if (parsed.orderNumber === params.orderNumber) setStored(parsed);
    }
  }, [params.orderNumber]);

  useEffect(() => {
    if (!stored) return;
    const load = async () => {
      const res = await fetch(
        `/api/orders/${stored.orderNumber}?accessCode=${encodeURIComponent(stored.accessCode)}`
      );
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => window.clearInterval(id);
  }, [stored]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    const expires = order?.reservationExpiresAt || stored?.reservationExpiresAt;
    if (!expires) return null;
    return Math.max(0, new Date(expires).getTime() - now);
  }, [order, stored, now]);

  const mmss = remaining !== null
    ? `${String(Math.floor(remaining / 60000)).padStart(2, "0")}:${String(
        Math.floor((remaining % 60000) / 1000)
      ).padStart(2, "0")}`
    : null;

  const markSubmitted = async () => {
    if (!stored) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${stored.orderNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitted_payment",
          accessCode: stored.accessCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update");
      setMessage(data.message);
      setOrder((prev: any) =>
        prev
          ? { ...prev, status: data.order.status, paymentStatus: data.order.paymentStatus }
          : prev
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!stored) {
    return (
      <div className="container-page py-20">
        <div className="glass-panel p-8 text-center">
          <h1 className="font-display text-4xl text-white">Payment Session Missing</h1>
          <p className="mt-3 text-white/60">
            Use Find My Ticket with your order ID and access code, or start a new booking.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/find-ticket" className="btn btn-primary">
              Find My Ticket
            </Link>
            <Link href="/stadium" className="btn btn-secondary">
              Book Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const paid =
    order?.paymentStatus === "PAID" ||
    order?.status === "PAID" ||
    order?.status === "TICKET_ISSUED";

  if (paid) {
    return (
      <div className="container-page py-16 text-center">
        <div className="glass-panel mx-auto max-w-xl p-8">
          <h1 className="font-display text-5xl text-white">Payment Verified</h1>
          <p className="mt-3 text-white/65">Your tickets are ready.</p>
          <Link
            href={`/order/${stored.orderNumber}/confirmation?accessCode=${encodeURIComponent(stored.accessCode)}`}
            className="btn btn-primary mt-6"
          >
            View Confirmation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Payment
        </div>
        <h1 className="mt-2 font-display text-5xl text-white">Complete Payment</h1>

        {mmss && remaining !== null && remaining > 0 ? (
          <div className="mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
            YOUR TICKETS ARE RESERVED FOR <strong className="ml-2 font-display text-2xl">{mmss}</strong>
          </div>
        ) : remaining === 0 ? (
          <div className="mt-5 rounded-2xl border border-[var(--danger)]/30 bg-[rgba(255,92,108,0.12)] px-4 py-3 text-sm text-[#ff8a96]">
            Reservation expired. Please start a new order.
          </div>
        ) : null}

        <div className="glass-panel mt-6 space-y-4 p-6">
          <div className="flex justify-between text-sm">
            <span className="text-white/55">Order ID</span>
            <span className="font-mono font-semibold text-white">{stored.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/55">Access Code</span>
            <span className="font-mono font-semibold text-white">{stored.accessCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/55">Amount Due</span>
            <span className="font-bold text-[var(--brand)]">
              {order?.totalFormatted || stored.totalFormatted}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            {stored.instructions ||
              "Pay the exact amount on the external page, then return here. Opening the payment link does not mark your order as paid."}
          </p>

          <a
            href={stored.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary w-full"
          >
            {stored.buttonText || "Pay Now"}
          </a>

          <Button
            variant="secondary"
            fullWidth
            loading={submitting}
            disabled={remaining === 0}
            onClick={markSubmitted}
          >
            I&apos;ve Submitted Payment — Awaiting Verification
          </Button>

          {message ? <p className="text-sm text-white/70">{message}</p> : null}

          <button
            type="button"
            className="text-sm font-semibold text-[var(--brand)]"
            onClick={() =>
              openWithContext({
                subject: "Payment support",
                message: `I need help with order ${stored.orderNumber}.`,
                tag: "PAYMENT_SUPPORT",
              })
            }
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
