"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useChat } from "@/components/providers/ChatProvider";
import { formatMatchDate, formatMatchTime } from "@/lib/format";

export default function ConfirmationPage() {
  const params = useParams<{ orderNumber: string }>();
  const search = useSearchParams();
  const { openWithContext } = useChat();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessCode =
      search.get("accessCode") ||
      (() => {
        try {
          const raw = sessionStorage.getItem("arenanights_order");
          return raw ? JSON.parse(raw).accessCode : "";
        } catch {
          return "";
        }
      })();

    if (!accessCode) {
      setError("Access code required");
      return;
    }

    fetch(`/api/orders/${params.orderNumber}?accessCode=${encodeURIComponent(accessCode)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load");
        setOrder(data.order);
      })
      .catch((err) => setError(err.message));
  }, [params.orderNumber, search]);

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <div className="glass-panel mx-auto max-w-lg p-8">
          <h1 className="font-display text-4xl text-white">Unable to load booking</h1>
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
        <div className="skeleton mx-auto h-64 max-w-xl" />
      </div>
    );
  }

  const ready = order.status === "TICKET_ISSUED" || order.tickets?.length > 0;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="stadium-beam left-[20%]" />
        <div className="stadium-beam left-[60%]" style={{ animationDelay: "1.5s" }} />
        {ready
          ? Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="absolute top-10 h-2 w-2 rounded-sm"
                style={{
                  left: `${8 + ((i * 17) % 84)}%`,
                  background: i % 2 ? "#2ee59d" : "#f0c75e",
                  animation: "confetti-fall 1.8s ease-out both",
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))
          : null}
      </div>

      <div className="container-page relative z-10 py-14">
        <div className="mx-auto max-w-2xl text-center animate-fade-up">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[var(--brand)]" />
          <h1 className="mt-4 font-display text-5xl tracking-[0.06em] text-white md:text-6xl">
            {ready ? "YOU'RE GOING TO THE MATCH" : "BOOKING RECEIVED"}
          </h1>
          <p className="mt-3 text-white/65">
            {ready
              ? "Payment verified. Your digital QR passes are ready."
              : "Your order is awaiting payment verification. Tickets will appear here once confirmed."}
          </p>
        </div>

        <article className="glass-panel mx-auto mt-8 max-w-2xl overflow-hidden animate-fade-up">
          <div className="border-b border-white/10 bg-gradient-to-r from-[rgba(46,229,157,0.15)] to-transparent px-6 py-4">
            <div className="font-display text-3xl text-white">Arena Nights Pass</div>
            <div className="text-sm text-white/55">Order {order.orderNumber}</div>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <Field label="Match" value={`${order.match.teamAName} vs ${order.match.teamBName}`} />
            <Field label="Date" value={formatMatchDate(order.match.matchDate)} />
            <Field label="Time" value={formatMatchTime(order.match.matchDate)} />
            <Field label="Stadium" value={`${order.match.stadiumName}, ${order.match.city}`} />
            <Field label="Category" value={order.items?.[0]?.categoryName || "—"} />
            <Field label="Quantity" value={String(order.quantity)} />
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-5 sm:flex-row">
            {ready ? (
              <>
                <Link
                  href={`/order/${order.orderNumber}/tickets?accessCode=${encodeURIComponent(
                    search.get("accessCode") ||
                      JSON.parse(sessionStorage.getItem("arenanights_order") || "{}").accessCode ||
                      ""
                  )}`}
                  className="btn btn-primary flex-1"
                >
                  View Ticket
                </Link>
                <Link
                  href={`/order/${order.orderNumber}/tickets?accessCode=${encodeURIComponent(
                    search.get("accessCode") ||
                      JSON.parse(sessionStorage.getItem("arenanights_order") || "{}").accessCode ||
                      ""
                  )}&download=1`}
                  className="btn btn-secondary flex-1"
                >
                  Download QR Pass
                </Link>
              </>
            ) : (
              <Link
                href={`/order/${order.orderNumber}/pay`}
                className="btn btn-secondary flex-1"
              >
                Return to Payment
              </Link>
            )}
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() =>
                openWithContext({
                  subject: "Booking support",
                  message: `I need help with order ${order.orderNumber}.`,
                })
              }
            >
              Contact Support
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}
