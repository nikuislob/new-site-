import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatMatchDate, formatMoney } from "@/lib/utils";
import { ArrowRight, MapPin, Calendar, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matches = await prisma.match.findMany({
    where: { isPublished: true },
    orderBy: { matchDate: "asc" },
    take: 3,
  });
  const categories = await prisma.ticketCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const announcement = await prisma.siteSetting.findUnique({ where: { key: "announcement" } });

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="/images/stadium-metlife.svg"
          alt="Stadium night atmosphere"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(8,67,44,0.92)] via-[rgba(8,67,44,0.72)] to-[rgba(8,67,44,0.35)]" />
        <div className="container-page relative z-10 flex min-h-[88vh] flex-col justify-center py-16 text-white">
          <p className="animate-rise font-display text-5xl tracking-[0.12em] text-[var(--gold)] sm:text-7xl md:text-8xl">
            FIFA TICKETS
          </p>
          <h1 className="animate-rise-delay mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
            Choose your seats. Pay in seconds.
          </h1>
          <p className="animate-rise-delay mt-4 max-w-lg text-base text-white/85 sm:text-lg">
            Interactive seat maps for FIFA match nights with Basic and Premium inventory, Apple Pay and Cash App redirects.
          </p>
          <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
            <Link href="/matches" className="btn btn-gold animate-pulse-soft">
              Browse Matches <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="btn btn-outline !border-white !text-white hover:!bg-white/10">
              Bulk Orders
            </Link>
          </div>
        </div>
      </section>

      {announcement?.value && (
        <div className="border-y border-[var(--line)] bg-[var(--gold-soft)]">
          <p className="container-page py-3 text-center text-sm font-medium text-[var(--ink)]">
            {announcement.value}
          </p>
        </div>
      )}

      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--pitch)]">Upcoming</p>
            <h2 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)] sm:text-5xl">
              Featured Matches
            </h2>
          </div>
          <Link href="/matches" className="hidden text-sm font-semibold text-[var(--pitch)] sm:inline-flex">
            View all →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {matches.map((match, i) => (
            <Link
              key={match.id}
              href={`/matches/${match.slug}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-[var(--shadow)] transition hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="relative h-44 overflow-hidden bg-[var(--pitch-soft)]">
                {match.stadiumImage && (
                  <Image
                    src={match.stadiumImage}
                    alt={match.stadiumName}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-5">
                <p className="font-display text-3xl tracking-[0.05em] text-[var(--pitch-deep)]">
                  {match.homeTeam} vs {match.opponent}
                </p>
                <div className="mt-3 space-y-1.5 text-sm text-[var(--ink-muted)]">
                  <p className="flex items-center gap-2">
                    <Calendar size={14} /> {formatMatchDate(match.matchDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={14} /> Kickoff {match.matchTime}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} /> {match.stadiumName}
                  </p>
                </div>
                <span className="mt-4 inline-flex text-sm font-bold text-[var(--pitch)]">
                  Select seats →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[var(--pitch-deep)] py-16 text-white">
        <div className="container-page">
          <h2 className="font-display text-4xl tracking-[0.06em] sm:text-5xl">Ticket Categories</h2>
          <p className="mt-2 max-w-xl text-white/75">
            Online purchases are capped at 2 tickets. For larger groups, use Chat Now on the match page.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                style={{ borderTop: `4px solid ${cat.color}` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-3xl tracking-[0.06em]">{cat.name}</h3>
                  <p className="text-2xl font-bold text-[var(--gold)]">{formatMoney(cat.price)}</p>
                </div>
                <p className="mt-2 text-sm text-white/75">{cat.description}</p>
                <p className="mt-4 text-xs uppercase tracking-wider text-white/55">
                  1 ticket → payment link · 2 tickets → payment link · 3+ → Chat Now
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
