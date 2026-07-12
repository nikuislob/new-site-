import Link from "next/link";
import { prisma } from "@/lib/db";
import { availableInventory } from "@/lib/inventory";
import { getSettings } from "@/lib/settings";
import { availabilityLabel } from "@/lib/utils";
import { FeaturedMatchCard } from "@/components/match/FeaturedMatchCard";
import { MatchCountdown } from "@/components/match/MatchCountdown";
import { HeroStadium } from "@/components/home/HeroStadium";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  const match = await prisma.match.findFirst({
    where: { isActive: true, isFeatured: true },
    include: { categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { matchDate: "asc" },
  });

  const categories =
    match?.categories.map((c) => ({
      ...c,
      available: availableInventory(c.totalInventory, c.reservedCount, c.soldCount),
    })) || [];
  const totalAvailable = categories.reduce((s, c) => s + c.available, 0);
  const totalInventory = categories.reduce((s, c) => s + c.totalInventory, 0);
  const availability =
    !match || match.isSoldOut || totalAvailable <= 0
      ? "SOLD OUT"
      : availabilityLabel(totalAvailable, totalInventory);
  const fromPrice = categories[0]?.priceCents;

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <HeroStadium />
        <div className="relative z-10 container-page flex min-h-[100svh] flex-col justify-center py-16">
          <div className="max-w-3xl animate-fade-up">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
              {settings.store_name || "Arena Nights"}
            </div>
            <h1 className="font-display text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-8xl">
              {settings.hero_headline || "THE WORLD'S BIGGEST FOOTBALL NIGHT AWAITS"}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              {settings.hero_subcopy ||
                "Choose your view. Secure your seat. Experience every moment live from inside the stadium."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/stadium" className="btn btn-primary">
                GET TICKETS
              </Link>
              <Link href="/stadium#map" className="btn btn-secondary">
                EXPLORE THE STADIUM
              </Link>
            </div>
          </div>

          {match ? (
            <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <FeaturedMatchCard
                teamAName={match.teamAName}
                teamBName={match.teamBName}
                teamACode={match.teamACode}
                teamBCode={match.teamBCode}
                teamAFlagUrl={match.teamAFlagUrl}
                teamBFlagUrl={match.teamBFlagUrl}
                matchDate={match.matchDate.toISOString()}
                stadiumName={match.stadiumName}
                city={match.city}
                availability={availability}
                fromPriceCents={fromPrice}
              />
              <div className="glass-panel p-5">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">
                  Kickoff Countdown
                </div>
                <div className="mt-4">
                  <MatchCountdown targetIso={match.matchDate.toISOString()} />
                </div>
                <p className="mt-4 text-sm text-white/55">
                  Live inventory from the Arena Nights box office. No fake scarcity. No fake viewer
                  counts.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-page py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl tracking-[0.08em] text-white md:text-5xl">
            Match Night, Elevated
          </h2>
          <p className="mt-4 text-white/65">
            Interactive stadium selection, secure payment link routing, reserved inventory, and
            downloadable QR passes — designed as one continuous experience.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Choose Your View",
              copy: "Explore seating zones on an interactive stadium map with clear viewing quality.",
            },
            {
              title: "Secure Checkout",
              copy: "Backend-priced totals, inventory holds, and admin-configurable payment destinations.",
            },
            {
              title: "QR Ticket Pass",
              copy: "Tickets are generated only after payment is verified — never on click alone.",
            },
          ].map((item, i) => (
            <article
              key={item.title}
              className="glass-panel p-5 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="font-display text-2xl tracking-[0.08em] text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
