"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

type CheckoutDraft = {
  matchId: string;
  ticketCategoryId: string;
  categoryName: string;
  zoneCode: string;
  zoneName: string;
  quantity: number;
  unitPriceCents: number;
};

type PaymentMethod = {
  code: string;
  name: string;
  iconUrl?: string | null;
  buttonText: string;
  instructions?: string | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"APPLE_PAY" | "CASH_APP" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("arenanights_checkout");
    if (!raw) {
      router.replace("/stadium");
      return;
    }
    setDraft(JSON.parse(raw));
    fetch("/api/payments/methods")
      .then((r) => r.json())
      .then((d) => setMethods(d.methods || []))
      .catch(() => setMethods([]));
  }, [router]);

  const total = useMemo(
    () => (draft ? draft.unitPriceCents * draft.quantity : 0),
    [draft]
  );

  const submit = async () => {
    if (!draft || !method) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: draft.matchId,
          ticketCategoryId: draft.ticketCategoryId,
          zoneCode: draft.zoneCode,
          quantity: draft.quantity,
          customerName: name,
          customerEmail: email,
          customerPhone: phone || null,
          paymentMethodCode: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      sessionStorage.setItem(
        "arenanights_order",
        JSON.stringify({
          orderNumber: data.order.orderNumber,
          accessCode: data.order.accessCode,
          paymentUrl: data.paymentUrl,
          buttonText: data.buttonText,
          instructions: data.instructions,
          reservationExpiresAt: data.order.reservationExpiresAt,
          totalFormatted: data.order.totalFormatted,
        })
      );
      sessionStorage.removeItem("arenanights_checkout");
      router.push(`/order/${data.order.orderNumber}/pay`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!draft) {
    return (
      <div className="container-page py-20">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Checkout
        </div>
        <h1 className="mt-2 font-display text-5xl tracking-[0.06em] text-white">Secure Your Seats</h1>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <section className="glass-panel p-5">
            <h2 className="font-display text-2xl text-white">Customer Details</h2>
            <div className="mt-4 grid gap-3">
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="font-display text-2xl text-white">Payment Method</h2>
            <p className="mt-2 text-sm text-white/55">
              You will be redirected to a secure external payment page. We never collect card numbers,
              CVV, or wallet passwords.
            </p>
            <div className="mt-4 grid gap-3">
              {methods.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setMethod(m.code as "APPLE_PAY" | "CASH_APP")}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                    method === m.code
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-white/10 bg-black/20 hover:border-white/25"
                  }`}
                >
                  {m.iconUrl ? (
                    <Image src={m.iconUrl} alt="" width={36} height={36} className="rounded-lg" />
                  ) : null}
                  <div>
                    <div className="font-semibold text-white">{m.name}</div>
                    <div className="text-xs text-white/50">{m.buttonText}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="glass-panel h-fit p-5">
          <h2 className="font-display text-2xl text-white">Order Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Category</dt>
              <dd className="font-semibold text-white">{draft.categoryName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Section</dt>
              <dd className="font-semibold text-white">{draft.zoneName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Quantity</dt>
              <dd className="font-semibold text-white">{draft.quantity}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Price / ticket</dt>
              <dd className="font-semibold text-white">{formatCurrency(draft.unitPriceCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="text-white/55">Subtotal</dt>
              <dd className="font-semibold text-white">{formatCurrency(total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Fees</dt>
              <dd className="font-semibold text-white">$0.00</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3 text-base">
              <dt className="font-bold text-white">Total</dt>
              <dd className="font-bold text-[var(--brand)]">{formatCurrency(total)}</dd>
            </div>
          </dl>

          {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

          <Button
            className="mt-5"
            fullWidth
            loading={loading}
            disabled={!name || !email || !method}
            onClick={submit}
          >
            Create Order & Continue to Pay
          </Button>
        </aside>
      </div>
    </div>
  );
}
