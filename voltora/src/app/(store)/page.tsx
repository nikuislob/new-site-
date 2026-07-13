import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Headphones, LockKeyhole, Radio, TicketCheck, Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { ACTIVE_MATCH_STATUSES, releaseExpiredReservations } from "@/lib/tickets";
import { MatchCard } from "@/components/matches/MatchCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await releaseExpiredReservations();
  const matches = await prisma.eventMatch.findMany({
    where: {
      kickoffAt: { gt: new Date() },
      status: { in: ACTIVE_MATCH_STATUSES },
      isVisible: true,
    },
    orderBy: { kickoffAt: "asc" },
    include: {
      venue: true,
      listings: {
        where: { isActive: true, quantityAvailable: { gt: 0 } },
        select: { price: true, currency: true, quantityAvailable: true },
      },
    },
  });

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[680px] overflow-hidden bg-[#061a12] text-white">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_70%_28%,#35e89b_0,transparent_26%),linear-gradient(115deg,transparent_45%,rgba(255,255,255,.08)_46%,transparent_47%)]" />
        <div className="stadium-rings absolute -right-[15%] top-[8%] h-[520px] w-[680px] rounded-[50%] border border-white/10" />
        <div className="container-page relative grid min-h-[640px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div className="animate-fade-up">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#8ff5c7]">
              <Radio className="h-3.5 w-3.5" /> Remaining World Cup 2026 matches
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[.96] tracking-[-.055em] sm:text-7xl lg:text-[84px]">
              Your Seat.<br /><span className="text-[var(--brand)]">Your Match.</span><br />Your Moment.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/62 sm:text-lg">
              Find your place in football history with transparent pricing, protected inventory, and support through delivery.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="#matches" className="btn bg-[var(--brand)] px-6 py-3.5 font-bold text-[#061a12] shadow-[0_14px_40px_rgba(49,227,151,.24)] hover:-translate-y-0.5">
                Explore matches <ArrowDown className="h-4 w-4" />
              </Link>
              <Link href="/support" className="btn border border-white/15 bg-white/5 px-6 py-3.5 text-white hover:bg-white/10">How it works</Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="mx-auto aspect-[4/3] max-w-[520px] rotate-[-3deg] rounded-[40px] border border-white/15 bg-white/[.06] p-6 shadow-2xl backdrop-blur">
              <div className="relative h-full overflow-hidden rounded-[30px] bg-[#0d5c3d] p-7 [background-image:linear-gradient(90deg,transparent_49.7%,rgba(255,255,255,.45)_50%,transparent_50.3%),linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:auto,36px_36px,36px_36px]">
                <div className="absolute inset-[12%] rounded-[50%] border-2 border-white/50" />
                <div className="absolute inset-y-[12%] left-[6%] w-[18%] border-2 border-white/50" />
                <div className="absolute inset-y-[12%] right-[6%] w-[18%] border-2 border-white/50" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-[#061a12]/75 p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-[.2em] text-[#8ff5c7]">Next on the journey</p>
                  <div className="mt-2 flex items-center justify-between font-display text-xl font-bold"><span>Semi-finals</span><ArrowRight /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/15">
          <div className="container-page grid gap-4 py-5 text-xs text-white/60 sm:grid-cols-3">
            <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[var(--brand)]" /> Server-side pricing</span>
            <span className="flex items-center gap-2"><TicketCheck className="h-4 w-4 text-[var(--brand)]" /> Protected ticket reservations</span>
            <span className="flex items-center gap-2"><Headphones className="h-4 w-4 text-[var(--brand)]" /> Order-linked support</span>
          </div>
        </div>
      </section>

      <section id="matches" className="container-page scroll-mt-32 py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[#17845f]">The road to glory</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Upcoming matches</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">Only scheduled, uncompleted matches appear. Prices reflect the lowest active inventory listing.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#17845f]"><span className="h-2 w-2 rounded-full bg-[#31e397]" /> {matches.length} matches available</div>
        </div>
        {matches.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {matches.map((match) => <MatchCard key={match.id} match={match} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] border border-[#dce8e2] bg-white p-12 text-center">
            <Trophy className="mx-auto h-9 w-9 text-[#17845f]" />
            <h3 className="mt-4 font-display text-2xl font-bold">No matches currently on sale</h3>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">Check back when new verified inventory becomes available.</p>
          </div>
        )}
      </section>

      <section id="journey" className="scroll-mt-32 bg-[#eaf3ee] py-20">
        <div className="container-page">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#17845f]">Tournament journey</p>
          <div className="mt-3 grid items-end gap-6 lg:grid-cols-2">
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Four matches.<br />One world champion.</h2>
            <p className="max-w-xl text-sm leading-6 text-[#587067] lg:justify-self-end">Team placeholders update from the configured match-data provider as knockout results become official. Your order remains attached to the match.</p>
          </div>
          <div className="mt-12 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            {[
              ["01", "Semi-finals", "Four teams remain"],
              ["02", "Third place", "One final podium place"],
              ["03", "The Final", "A champion is crowned"],
            ].map(([number, title, copy], index) => (
              <div key={title} className="contents">
                <div className="rounded-[24px] bg-white p-6 shadow-sm">
                  <span className="font-display text-4xl font-extrabold text-[#cae2d7]">{number}</span>
                  <h3 className="mt-8 font-display text-xl font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-[#6a8178]">{copy}</p>
                </div>
                {index < 2 ? <ArrowRight className="mx-auto hidden text-[#89a79a] md:block" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="rounded-[32px] bg-[#071b13] px-6 py-12 text-white sm:px-10 lg:px-14">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--brand)]">Built for confidence</p><h2 className="mt-3 font-display text-4xl font-extrabold">From selection to your seat.</h2></div>
            <div className="grid gap-5 sm:grid-cols-2">
              {["Secure checkout flow", "Transparent price breakdown", "Order tracking", "Ticket delivery updates"].map((item) => (
                <div key={item} className="flex items-center gap-3 border-b border-white/10 pb-4 text-sm text-white/70"><span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand)]/15"><Check className="h-4 w-4 text-[var(--brand)]" /></span>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
