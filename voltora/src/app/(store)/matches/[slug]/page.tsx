import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { isMatchPurchasable, releaseExpiredReservations } from "@/lib/tickets";
import { EventCountdown } from "@/components/matches/EventCountdown";
import { TicketMarketplace } from "@/components/matches/TicketMarketplace";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const match = await prisma.eventMatch.findUnique({ where: { slug } });
  return match
    ? { title: `${match.homeTeam} vs ${match.awayTeam} tickets`, description: `Browse available ${match.round} tickets with transparent pricing.` }
    : { title: "Match not found" };
}

export default async function MatchPage({ params }: Params) {
  await releaseExpiredReservations();
  const { slug } = await params;
  const match = await prisma.eventMatch.findUnique({
    where: { slug },
    include: {
      venue: true,
      listings: { where: { isActive: true, quantityAvailable: { gt: 0 } }, orderBy: { price: "asc" } },
    },
  });
  if (!match || !match.isVisible) notFound();
  const purchasable = isMatchPurchasable(match);
  const localDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: match.venue.timezone }).format(match.kickoffAt);
  const localTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: match.venue.timezone }).format(match.kickoffAt);

  return (
    <>
      <section className="bg-[#071b13] text-white">
        <div className="container-page py-5">
          <div className="flex items-center gap-2 text-xs text-white/45"><Link href="/" className="hover:text-white">Matches</Link><ChevronRight className="h-3.5 w-3.5" /><span>{match.round}</span></div>
        </div>
        <div className="container-page grid gap-10 pb-14 pt-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3"><span className="rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--brand)]">FIFA World Cup 2026 · {match.round}</span></div>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{match.homeTeam}<span className="mx-3 text-white/25">vs</span>{match.awayTeam}</h1>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/60">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[var(--brand)]" /> {localDate} · {localTime}</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--brand)]" /> {match.venue.name}, {match.venue.city}</span>
            </div>
          </div>
          {purchasable ? <div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Kickoff countdown</p><EventCountdown kickoff={match.kickoffAt.toISOString()} /></div> : null}
        </div>
      </section>
      <div className="border-b border-[#dbe7e1] bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold text-[#176846]"><span className="h-2 w-2 rounded-full bg-[#35e89b]" /> {match.listings.length} active ticket listings</span>
          <span className="inline-flex items-center gap-2 text-[#697f76]"><ShieldCheck className="h-4 w-4" /> Prices and applicable fees shown before payment</span>
        </div>
      </div>
      <main className="container-page py-10 sm:py-14">
        {purchasable ? (
          match.listings.length ? <TicketMarketplace listings={match.listings} /> : <Unavailable message="There is no active ticket inventory for this match." />
        ) : <Unavailable message="Purchasing has closed because this match is no longer upcoming." />}
      </main>
    </>
  );
}

function Unavailable({ message }: { message: string }) {
  return <div className="rounded-[28px] border border-[#dce8e2] bg-white p-12 text-center"><h2 className="font-display text-2xl font-bold">Tickets currently unavailable</h2><p className="mt-3 text-sm text-[var(--ink-muted)]">{message}</p><Link href="/#matches" className="btn btn-dark mt-6">View upcoming matches</Link></div>;
}
