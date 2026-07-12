import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { FeaturedTeams } from "@/components/home/FeaturedTeams";
import { MatchCard } from "@/components/matches/MatchCard";
import { getUpcomingMatches, serializeMatch, availableSeats } from "@/lib/matches";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, matches] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "default" } }),
    getUpcomingMatches(),
  ]);

  const serialized = matches.map((m) => serializeMatch(m));
  const nearest = serialized[0]?.kickoffAt || null;

  const teamMap = new Map<
    string,
    { id: string; name: string; country: string; logoUrl: string | null; upcomingCount: number }
  >();
  for (const m of matches) {
    for (const team of [m.homeTeam, m.awayTeam]) {
      const existing = teamMap.get(team.id);
      if (existing) existing.upcomingCount += 1;
      else
        teamMap.set(team.id, {
          id: team.id,
          name: team.name,
          country: team.country,
          logoUrl: team.logoUrl,
          upcomingCount: 1,
        });
    }
  }

  return (
    <>
      <Hero
        headline={settings?.heroHeadline || "Book Your Football Tickets"}
        subheadline={
          settings?.heroSubheadline ||
          "Premium seats. Iconic stadiums. Unforgettable nights under the lights."
        }
        nearestKickoff={nearest}
      />

      <section className="container-page py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--gold)]">Fixtures</p>
            <h2 className="font-display text-5xl md:text-6xl">Upcoming Matches</h2>
            <p className="mt-2 text-[var(--ink-muted)]">
              Only future kickoffs — completed matches disappear automatically.
            </p>
          </div>
          <Link href="/matches" className="text-sm font-semibold text-[var(--emerald)] hover:text-[var(--gold)]">
            View all matches →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {serialized.slice(0, 4).map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              upperPrice={settings?.upperSeatPrice}
              closerPrice={settings?.closerSeatPrice}
            />
          ))}
        </div>
      </section>

      <FeaturedTeams teams={Array.from(teamMap.values()).slice(0, 8)} />

      <section className="container-page pb-20">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--gold)]">Calendar</p>
          <h2 className="font-display text-5xl md:text-6xl">Latest Fixtures</h2>
          <p className="mt-2 text-[var(--ink-muted)]">Sorted by nearest date. Expired fixtures never appear.</p>
        </div>
        <div className="space-y-3">
          {serialized.map((match) => {
            const avail = availableSeats(match);
            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="glass flex flex-col gap-3 rounded-2xl px-5 py-4 transition hover:border-[var(--gold)]/40 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {match.homeTeam.name} vs {match.awayTeam.name}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {match.stadium} · {match.country}
                  </p>
                </div>
                <div className="text-sm text-[var(--ink-muted)] md:text-right">
                  <p>{new Date(match.kickoffAt).toLocaleString()}</p>
                  <p className="text-[var(--emerald)]">{avail.totalAvailable} seats available</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
