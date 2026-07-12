import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { BASIC_PRICE_CENTS, PREMIUM_PRICE_CENTS } from "@/lib/tickets";

export default function SeatingPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-display text-5xl font-bold sm:text-6xl">Seating positions</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
        Simple two-tier map modeled after major stadium ticket sites — choose the view that fits your budget.
      </p>

      <div className="mt-10 overflow-hidden rounded-[var(--radius)] bg-[var(--bg)] p-6 text-white md:p-10">
        <div className="relative mx-auto aspect-[16/9] max-w-4xl rounded-2xl border-2 border-white/20 bg-[linear-gradient(90deg,#0f3d24,#1f8a4c,#0f3d24)]">
          <div className="absolute inset-6 rounded-xl border border-white/25" />
          <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-white/25" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-black/45 p-4 backdrop-blur">
              <p className="font-display text-2xl font-bold">Basic Seat</p>
              <p className="text-sm text-[#c9ddd2]">Lower & upper bowl · Sections 101–140</p>
              <p className="mt-2 font-display text-3xl font-bold text-[var(--accent)]">
                {formatCurrency(BASIC_PRICE_CENTS)}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--accent)] p-4 text-[var(--bg)]">
              <p className="font-display text-2xl font-bold">Premium Seat</p>
              <p className="text-sm opacity-80">Club level · Midfield sightlines</p>
              <p className="mt-2 font-display text-3xl font-bold">{formatCurrency(PREMIUM_PRICE_CENTS)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">What Basic includes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--ink-muted)]">
            <li>Standard stadium entry</li>
            <li>Assigned bowl seating</li>
            <li>Ideal for groups watching the full pitch</li>
          </ul>
        </div>
        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">What Premium includes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--ink-muted)]">
            <li>Closer club / sideline sections</li>
            <li>Wider seating</li>
            <li>Best atmosphere near midfield</li>
          </ul>
        </div>
      </div>

      <Link href="/matches" className="btn btn-primary mt-10 inline-flex">
        Choose a match
      </Link>
    </div>
  );
}
