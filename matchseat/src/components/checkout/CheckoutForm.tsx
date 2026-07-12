"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SEAT_TIERS } from "@/lib/tickets";

type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  iconUrl: string | null;
  buttonText: string;
  instructions: string | null;
};

export function CheckoutForm() {
  const router = useRouter();
  const { items, clear, totalCents, ticketCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodId, setMethodId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
  });

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const me = await meRes.json();
          if (me.user) {
            setForm((f) => ({
              ...f,
              guestName: `${me.user.firstName} ${me.user.lastName || ""}`.trim(),
              guestEmail: me.user.email,
              guestPhone: me.user.phone || "",
            }));
          }
        }
      } catch {
        /* guest checkout */
      }
      try {
        const res = await fetch("/api/checkout/methods");
        if (res.ok) {
          const data = await res.json();
          setMethods(data.paymentMethods || []);
          if (data.paymentMethods?.[0]) setMethodId(data.paymentMethods[0].id);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const total = mounted ? totalCents() : 0;
  const count = mounted ? ticketCount() : 0;

  if (!mounted) return <p className="text-[var(--ink-muted)]">Loading checkout…</p>;

  if (items.length === 0) {
    return (
      <div className="card-quiet p-8 text-center">
        <p className="font-display text-3xl font-bold">No tickets selected</p>
        <Link href="/matches" className="btn btn-primary mt-4 inline-flex">
          Browse matches
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethodId: methodId,
          items: items.map((i) => ({
            matchId: i.matchId,
            seatTier: i.seatTier,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      const orderNumber = data.order?.orderNumber || data.orderNumber;
      if (!orderNumber) throw new Error("Checkout succeeded but no order number was returned.");
      try {
        sessionStorage.setItem(
          "pitchpass_last_order",
          JSON.stringify({
            orderNumber,
            guestEmail: form.guestEmail.trim().toLowerCase(),
          })
        );
      } catch {
        /* ignore storage errors */
      }
      clear();
      router.push(`/order/${encodeURIComponent(orderNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">Buyer details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="Full name"
              required
              value={form.guestName}
              onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.guestEmail}
              onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
            />
            <Input
              label="Phone (optional)"
              value={form.guestPhone}
              onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
            />
            <Input
              label="City"
              required
              value={form.billingCity}
              onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
            />
            <Input
              label="State"
              required
              value={form.billingState}
              onChange={(e) => setForm({ ...form, billingState: e.target.value })}
            />
            <Input
              label="ZIP"
              required
              value={form.billingZip}
              onChange={(e) => setForm({ ...form, billingZip: e.target.value })}
            />
          </div>
        </div>

        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">Payment method</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            We open the Cash App or Apple Pay link for exactly {formatCurrency(total)}. Your order stays Payment Pending until confirmed.
          </p>
          <div className="mt-4 grid gap-3">
            {methods.length === 0 ? (
              <p className="text-sm text-[var(--danger)]">No payment methods available.</p>
            ) : (
              methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-4 py-4 ${
                    methodId === m.id ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--line)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={methodId === m.id}
                    onChange={() => setMethodId(m.id)}
                  />
                  {m.iconUrl ? (
                    <Image src={m.iconUrl} alt="" width={36} height={36} className="h-9 w-9" />
                  ) : null}
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{m.buttonText}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <aside className="card-quiet h-fit p-6">
        <h2 className="font-display text-3xl font-bold">Tickets</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <li key={`${item.matchId}-${item.seatTier}`} className="flex justify-between gap-3 border-b border-[var(--line)] pb-3">
              <span>
                {item.matchLabel}
                <br />
                <span className="text-[var(--ink-muted)]">
                  {SEAT_TIERS[item.seatTier].label} × {item.quantity}
                </span>
              </span>
              <span className="font-semibold">{formatCurrency(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between font-display text-3xl font-bold">
          <span>Total</span>
          <span className="text-[var(--brand-deep)]">{formatCurrency(total)}</span>
        </div>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">{count} ticket(s) · max 2 per customer</p>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" className="mt-5 w-full" loading={loading} disabled={!methodId}>
          Place order &amp; open payment
        </Button>
      </aside>
    </form>
  );
}
