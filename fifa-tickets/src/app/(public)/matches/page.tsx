import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatMatchDate } from "@/lib/utils";
import { Calendar, Clock, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches" };

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    where: { isPublished: true },
    orderBy: { matchDate: "asc" },
    include: {
      _count: {
        select: {
          seats: { where: { status: "AVAILABLE" } },
        },
      },
    },
  });

  return (
    <div className="container-page py-12">
      <p className="text-sm font-bold uppercase tracking-wider text-[var(--pitch)]">Schedule</p>
      <h1 className="font-display text-5xl tracking-[0.06em] text-[var(--pitch-deep)]">Upcoming Matches</h1>
      <p className="mt-2 max-w-2xl text-[var(--ink-muted)]">
        Pick a fixture, choose up to 2 seats, and you will be redirected to the matching Apple Pay / Cash App payment link.
      </p>

      <div className="mt-10 space-y-5">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.slug}`}
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow)] transition hover:-translate-y-0.5 md:flex-row"
          >
            <div className="relative h-48 w-full shrink-0 md:h-auto md:w-72">
              {match.stadiumImage && (
                <Image src={match.stadiumImage} alt={match.stadiumName} fill className="object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4 p-6">
              <div>
                <h2 className="font-display text-4xl tracking-[0.05em] text-[var(--pitch-deep)]">
                  {match.homeTeam} <span className="text-[var(--gold)]">vs</span> {match.opponent}
                </h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ink-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} /> {formatMatchDate(match.matchDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} /> {match.matchTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} /> {match.stadiumName}, {match.venue}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="badge bg-[var(--pitch-soft)] text-[var(--pitch)]">
                  {match._count.seats} seats available
                </span>
                <span className="font-semibold text-[var(--pitch)]">Select seats →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
