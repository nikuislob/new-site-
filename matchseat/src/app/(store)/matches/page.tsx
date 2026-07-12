import { prisma } from "@/lib/db";
import { MatchCard } from "@/components/matches/MatchCard";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    where: { isPublished: true },
    orderBy: { kickoffAt: "asc" },
  });

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-5xl font-bold sm:text-6xl">Upcoming matches</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
        Full schedule with venues, stages, and seating availability. Select a match to choose Basic or Premium seats.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}
