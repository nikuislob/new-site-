"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";

type CheckoutDraft = {
  matchId: string;
  category: "UPPER" | "CLOSER";
  seatIds: string[];
  holdToken: string;
  seats: { id: string; label: string; price: number; section: string; row: string; number: number }[];
  expiresAt: string;
};

type Settings = {
  maxTicketsPerOrder: number;
  serviceFeeEnabled: boolean;
  serviceFeePercent: number;
  taxEnabled: boolean;
  taxPercent: number;
  uniquePaymentEnabled: boolean;
  whatsappUrl: string;
};

export function CheckoutClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"APPLE_PAY" | "CASH_APP">("APPLE_PAY");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("pitchora_checkout");
    if (raw) {
      try {
        setDraft(JSON.parse(raw));
      } catch {
        setDraft(null);
      }
    }
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    if (!draft || !settings) return null;
    const subtotal = draft.seats.reduce((s, x) => s + x.price, 0);
    const serviceFee = settings.serviceFeeEnabled
      ? Math.round(subtotal * (settings.serviceFeePercent / 100) * 100) / 100
      : 0;
    const taxAmount = settings.taxEnabled
      ? Math.round(subtotal * (settings.taxPercent / 100) * 100) / 100
      : 0;
    const originalTotal = Math.round((subtotal + serviceFee + taxAmount) * 100) / 100;
    return { subtotal, serviceFee, taxAmount, originalTotal };
  }, [draft, settings]);

  if (loading) return <Spinner label="Preparing checkout..." />;

  if (!draft || !draft.holdToken || !draft.seatIds?.length) {
    return (
      <div className="space-y-4">
        <Notify tone="warn">No active seat hold. Please select seats on the stadium map first.</Notify>
        <Link href="/matches">
          <Button variant="gold">Browse Matches</Button>
        </Link>
      </div>
    );
  }

  if (draft.seatIds.length > (settings?.maxTicketsPerOrder ?? 2)) {
    return (
      <div className="space-y-4">
        <Notify tone="error">For bookings of 3 or more tickets, please contact our support team.</Notify>
        <Link href={`/bulk-request?matchId=${draft.matchId}`}>
          <Button variant="gold">Contact Admin</Button>
        </Link>
      </div>
    );
  }

  const holdExpired = draft.expiresAt && new Date(draft.expiresAt).getTime() < Date.now();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: draft.matchId,
          ticketCategory: draft.category,
          seatIds: draft.seatIds,
          holdToken: draft.holdToken,
          paymentMethod,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      sessionStorage.removeItem("pitchora_checkout");
      router.push(`/confirmation/${data.order.id}?pay=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <h1 className="font-display text-5xl">Checkout</h1>
        {holdExpired ? (
          <Notify tone="error">Your seat hold expired. Go back and select seats again.</Notify>
        ) : (
          <Notify tone="info">
            Seats temporarily held until {new Date(draft.expiresAt).toLocaleTimeString()}. Complete payment to confirm.
          </Notify>
        )}
        {error ? <Notify tone="error">{error}</Notify> : null}
        <Input
          id="name"
          label="Full name"
          required
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
        />
        <Input
          id="phone"
          label="Phone"
          required
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
        />

        <div>
          <p className="mb-3 text-sm text-[var(--ink-muted)]">Payment method</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("APPLE_PAY")}
              className={`rounded-2xl border px-4 py-4 text-left ${
                paymentMethod === "APPLE_PAY" ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--line)]"
              }`}
            >
              <p className="font-semibold">Apple Pay</p>
              <p className="text-xs text-[var(--ink-muted)]">Secure link checkout</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH_APP")}
              className={`rounded-2xl border px-4 py-4 text-left ${
                paymentMethod === "CASH_APP" ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--line)]"
              }`}
            >
              <p className="font-semibold">Cash App</p>
              <p className="text-xs text-[var(--ink-muted)]">Secure link checkout</p>
            </button>
          </div>
        </div>
      </div>

      <aside className="glass h-fit rounded-[var(--radius)] p-6">
        <h2 className="font-display text-3xl">Summary</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
          <li>Category: {draft.category === "UPPER" ? "Upper Side" : "Closer View"}</li>
          {draft.seats.map((s) => (
            <li key={s.id}>
              {s.label} — {formatCurrency(s.price)}
            </li>
          ))}
          <li>Subtotal: {formatCurrency(totals?.subtotal || 0)}</li>
          {totals && totals.serviceFee > 0 ? <li>Service fee: {formatCurrency(totals.serviceFee)}</li> : null}
          {totals && totals.taxAmount > 0 ? <li>Tax: {formatCurrency(totals.taxAmount)}</li> : null}
        </ul>
        <p className="mt-4 font-display text-4xl text-[var(--gold)]">
          {formatCurrency(totals?.originalTotal || 0)}
        </p>
        {settings?.uniquePaymentEnabled ? (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            A unique verification amount under +$3 may be added on the next step.
          </p>
        ) : null}
        <Button type="submit" variant="gold" className="mt-6 w-full" disabled={submitting || !!holdExpired}>
          {submitting ? "Processing..." : "Place Order & Pay"}
        </Button>
        <Link href={`/book/${draft.matchId}?category=${draft.category}`} className="mt-3 block text-center text-sm text-[var(--ink-muted)]">
          ← Back to stadium seats
        </Link>
      </aside>
    </form>
  );
}
