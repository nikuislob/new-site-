import Link from "next/link";
import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/matches/MatchCard";
import { formatCurrency } from "@/lib/utils";
import { BASIC_PRICE_CENTS, PREMIUM_PRICE_CENTS, MAX_TICKETS_PER_ORDER } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.match.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: { kickoffAt: "asc" },
    take: 3,
  });

  return (
    <>
      <section className="pitch-hero pitch-lines">
        <div className="container-page relative z-10 flex min-h-[min(88vh,760px)] flex-col justify-center py-16">
          <p className="animate-slide-in inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            <span className="live-dot" /> US match tickets
          </p>
          <h1 className="animate-fade-up mt-4 max-w-3xl font-display text-6xl font-extrabold leading-[0.95] text-white sm:text-7xl md:text-8xl">
            PitchPass
          </h1>
          <p className="animate-fade-up-delay mt-5 max-w-xl text-lg text-[#d5ebe0] sm:text-xl">
            Secure seats for upcoming international soccer in US stadiums. Basic {formatCurrency(BASIC_PRICE_CENTS)} · Premium {formatCurrency(PREMIUM_PRICE_CENTS)} · max {MAX_TICKETS_PER_ORDER} tickets per fan.
          </p>
          <div className="animate-fade-up-delay mt-8 flex flex-wrap gap-3">
            <Link href="/matches" className="btn btn-primary">
              Browse matches
            </Link>
            <Link href="/seating" className="btn btn-secondary">
              View seating
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl font-bold text-[var(--ink)] sm:text-5xl">Featured matches</h2>
            <p className="mt-2 text-[var(--ink-muted)]">Kickoff times shown for US fans — pick seats and checkout in minutes.</p>
          </div>
          <Link href="/matches" className="font-semibold text-[var(--brand-deep)] underline">
            All upcoming matches
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white py-16">
        <div className="container-page grid gap-10 md:grid-cols-3">
          {[
            {
              title: "Clear seat tiers",
              text: "Basic bowl seats at $70 and Premium club seats at $140 — inspired by major ticket platforms, simplified for fast checkout.",
            },
            {
              title: "Smart payment links",
              text: "Cart total auto-selects the Cash App or Apple Pay link for $70, $140, $210, or $280 so you maintain fewer payment destinations.",
            },
            {
              title: "US fan support",
              text: "Chat Now connects you with operators. Track orders in your account after sign-in.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-3xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
