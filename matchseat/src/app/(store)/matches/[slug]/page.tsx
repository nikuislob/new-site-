import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { SeatPicker } from "@/components/matches/SeatPicker";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = await prisma.match.findUnique({ where: { slug } });
  if (!match || !match.isPublished) notFound();

  return (
    <div className="container-page py-12">
      <div className="overflow-hidden rounded-[var(--radius)] bg-[linear-gradient(135deg,#07140f,#1f8a4c)] px-6 py-12 text-white md:px-10">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white/15 text-white">{match.stage}</Badge>
          {match.groupName ? <Badge className="bg-[var(--accent)] text-[var(--bg)]">{match.groupName}</Badge> : null}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-8">
          <div className="text-center">
            <p className="text-5xl">{match.homeFlag || "⚽"}</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold md:text-6xl">{match.homeTeam}</h1>
          </div>
          <p className="font-display text-3xl font-bold text-[var(--accent)]">VS</p>
          <div className="text-center">
            <p className="text-5xl">{match.awayFlag || "⚽"}</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold md:text-6xl">{match.awayTeam}</h1>
          </div>
        </div>
        <div className="mt-8 grid gap-2 text-sm text-[#d5ebe0] md:grid-cols-3">
          <p>{format(new Date(match.kickoffAt), "EEEE, MMM d, yyyy · h:mm a")} ET</p>
          <p>
            {match.venueName} · {match.venueCity}, {match.venueState}
          </p>
          <p>{match.venueCapacity ? `Capacity ${match.venueCapacity.toLocaleString()}` : "Stadium seating"}</p>
        </div>
        {match.description ? <p className="mt-6 max-w-3xl text-[#d5ebe0]">{match.description}</p> : null}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="card-quiet p-6">
          <h2 className="font-display text-3xl font-bold">Stadium seating guide</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[var(--line)] p-4">
              <p className="font-display text-2xl font-bold text-[var(--brand-deep)]">Basic · $70</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Sections 101–140 bowl seats. Clear pitch view, standard stadium access.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{match.basicStock} available</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] p-4">
              <p className="font-display text-2xl font-bold text-[var(--brand-deep)]">Premium · $140</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Club / midfield sections with wider seats and closer sightlines.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{match.premiumStock} available</p>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4 text-white">
            <p className="font-display text-xl font-bold">Pitch overview</p>
            <div className="relative mt-4 aspect-[16/10] rounded-xl border-2 border-white/20 bg-[linear-gradient(90deg,#14532d,#1f8a4c,#14532d)]">
              <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/30" />
              <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
              <div className="absolute bottom-2 left-2 rounded bg-black/40 px-2 py-1 text-[10px] font-bold uppercase">Basic bowl</div>
              <div className="absolute right-2 top-2 rounded bg-[var(--accent)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--bg)]">
                Premium club
              </div>
            </div>
          </div>
        </div>

        <SeatPicker
          match={{
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            venueName: match.venueName,
            venueCity: match.venueCity,
            venueState: match.venueState,
            kickoffAt: match.kickoffAt.toISOString(),
            basicStock: match.basicStock,
            premiumStock: match.premiumStock,
          }}
        />
      </div>
    </div>
  );
}
