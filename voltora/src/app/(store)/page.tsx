import { prisma } from "@/lib/db";
import { TicketExperience } from "@/components/tickets/TicketExperience";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matches = await prisma.match.findMany({
    where: { matchDate: { gt: new Date() } },
    orderBy: { matchDate: "asc" },
  });

  const payload = matches.map((m) => ({
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    venue: m.venue,
    stadiumViewUrl: m.stadiumViewUrl,
    matchDate: m.matchDate.toISOString(),
    standardAvailable: m.standardAvailable,
    premiumAvailable: m.premiumAvailable,
  }));

  return (
    <div className="container-page py-10 md:py-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-lime-400/20 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 p-8 md:p-12">
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-lime-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-lime-400">
            USA Match-Day Marketplace
          </div>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white md:text-6xl">
            Secure Your Seats for the Next Big Kickoff
          </h1>
          <p className="mt-4 text-base text-slate-300 md:text-lg">
            Standard View $85 · Premium View $150. Up to 2 tickets online. Apple Pay / Cash App
            payment-link checkout processed by our ops desk.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#tickets" className="btn btn-primary pulse-glow">
              Choose Seats
            </a>
            <a href="/admin" className="btn btn-secondary">
              Admin Dashboard
            </a>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <TicketExperience matches={payload} />
      </section>
    </div>
  );
}
