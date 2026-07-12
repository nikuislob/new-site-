"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/utils";
import { Apple, Smartphone } from "lucide-react";

type SeatInfo = {
  id: string;
  label: string;
  price: number;
};

type MatchInfo = {
  id: string;
  title: string;
  stadiumName: string;
};

type CategoryInfo = {
  id: string;
  code: string;
  name: string;
  price: number;
};

type Props = {
  match: MatchInfo;
  category: CategoryInfo;
  seats: SeatInfo[];
};

export function CheckoutForm({ match, category, seats }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => seats.reduce((s, x) => s + x.price, 0), [seats]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          categoryId: category.id,
          seatIds: seats.map((s) => s.id),
          firstName: fd.get("firstName"),
          lastName: fd.get("lastName"),
          email: fd.get("email"),
          phone: fd.get("phone") || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed");
        setLoading(false);
        return;
      }
      if (data.requiresBulk) {
        router.push(`/contact?match=${searchParams.get("match") || ""}&qty=${seats.length}`);
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      router.push(`/order/${data.orderNumber}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow)]">
        <h2 className="font-display text-3xl tracking-[0.05em] text-[var(--pitch-deep)]">Your Details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" required />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" required />
          </div>
          <div className="field sm:col-span-2">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field sm:col-span-2">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" name="phone" type="tel" />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-[#fdecea] px-4 py-3 text-sm text-[var(--danger)]">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary mt-6 w-full sm:w-auto">
          {loading ? "Redirecting to payment…" : "Pay with Apple Pay / Cash App"}
        </button>

        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--ink-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-white">
            <Apple size={12} /> Pay
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#00c244] px-2.5 py-1 text-white">
            <Smartphone size={12} /> Cash App
          </span>
          <span>You will be redirected to the configured payment link for this ticket package.</span>
        </div>
      </div>

      <aside className="h-fit rounded-2xl bg-[var(--pitch-deep)] p-6 text-white shadow-[var(--shadow)]">
        <h3 className="font-display text-3xl tracking-[0.05em]">Order Summary</h3>
        <p className="mt-2 text-sm text-white/75">{match.title}</p>
        <p className="text-sm text-white/60">{match.stadiumName}</p>
        <p className="mt-4 text-sm font-semibold text-[var(--gold)]">
          {category.name} · {formatMoney(category.price)} each
        </p>
        <ul className="mt-4 space-y-2 border-y border-white/10 py-4">
          {seats.map((s) => (
            <li key={s.id} className="flex justify-between text-sm">
              <span>{s.label}</span>
              <span>{formatMoney(s.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-[var(--gold)]">{formatMoney(total)}</span>
        </div>
      </aside>
    </form>
  );
}
