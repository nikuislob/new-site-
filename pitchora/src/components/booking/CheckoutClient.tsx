"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import { useBookingStore } from "@/store/booking";

type Settings = {
  upperSeatPrice: number;
  closerSeatPrice: number;
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
  const { matchId, seats, category, reset } = useBookingStore();
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
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    if (!settings || !category) return null;
    const unit = category === "UPPER" ? settings.upperSeatPrice : settings.closerSeatPrice;
    const subtotal = unit * seats.length;
    const serviceFee = settings.serviceFeeEnabled
      ? Math.round(subtotal * (settings.serviceFeePercent / 100) * 100) / 100
      : 0;
    const taxAmount = settings.taxEnabled
      ? Math.round(subtotal * (settings.taxPercent / 100) * 100) / 100
      : 0;
    const originalTotal = Math.round((subtotal + serviceFee + taxAmount) * 100) / 100;
    return { unit, subtotal, serviceFee, taxAmount, originalTotal };
  }, [settings, category, seats.length]);

  if (loading) return <Spinner label="Preparing checkout..." />;

  if (!matchId || !category || seats.length === 0) {
    return (
      <div className="space-y-4">
        <Notify tone="warn">Your seat selection is empty. Please choose seats first.</Notify>
        <Link href="/matches">
          <Button variant="gold">Browse Matches</Button>
        </Link>
      </div>
    );
  }

  if (seats.length > (settings?.maxTicketsPerOrder ?? 2)) {
    return (
      <div className="space-y-4">
        <Notify tone="error">
          For bookings of 3 or more tickets, please contact our support team.
        </Notify>
        <div className="flex flex-wrap gap-3">
          <Link href={`/bulk-request?matchId=${matchId}`}>
            <Button variant="gold">Contact Admin</Button>
          </Link>
          <Link href="/contact">
            <Button variant="secondary">Live Chat</Button>
          </Link>
          {settings?.whatsappUrl ? (
            <a href={settings.whatsappUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost">WhatsApp</Button>
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          ticketCategory: category,
          seatIds: seats.map((s) => s.id),
          paymentMethod,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      reset();
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
            <PayOption
              active={paymentMethod === "APPLE_PAY"}
              onClick={() => setPaymentMethod("APPLE_PAY")}
              title="Apple Pay"
              subtitle="Secure link checkout"
            />
            <PayOption
              active={paymentMethod === "CASH_APP"}
              onClick={() => setPaymentMethod("CASH_APP")}
              title="Cash App"
              subtitle="Secure link checkout"
            />
          </div>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Only Apple Pay and Cash App are supported. No other payment options.
          </p>
        </div>
      </div>

      <aside className="glass h-fit rounded-[var(--radius)] p-6">
        <h2 className="font-display text-3xl">Summary</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
          <li>Category: {category === "UPPER" ? "Upper Side" : "Closer View"}</li>
          <li>Seats: {seats.map((s) => `${s.section}-${s.row}-${s.number}`).join(", ")}</li>
          <li>Quantity: {seats.length}</li>
          <li>Unit price: {formatCurrency(totals?.unit || 0)}</li>
          <li>Subtotal: {formatCurrency(totals?.subtotal || 0)}</li>
          {totals && totals.serviceFee > 0 ? <li>Service fee: {formatCurrency(totals.serviceFee)}</li> : null}
          {totals && totals.taxAmount > 0 ? <li>Tax: {formatCurrency(totals.taxAmount)}</li> : null}
        </ul>
        <p className="mt-4 font-display text-4xl text-[var(--gold)]">
          {formatCurrency(totals?.originalTotal || 0)}
        </p>
        {settings?.uniquePaymentEnabled ? (
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            A unique verification amount under +$3 may be added on the next step to help identify your payment.
          </p>
        ) : null}
        <Button type="submit" variant="gold" className="mt-6 w-full" disabled={submitting}>
          {submitting ? "Processing..." : "Place Order & Pay"}
        </Button>
      </aside>
    </form>
  );
}

function PayOption({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        active ? "border-[var(--gold)] bg-[var(--gold-soft)]" : "border-[var(--line)] bg-black/30"
      }`}
    >
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-[var(--ink-muted)]">{subtitle}</p>
    </button>
  );
}
