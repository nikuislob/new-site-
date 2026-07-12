import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { MatchCard } from "@/components/matches/MatchCard";
import { EmptyState } from "@/components/ui/PageHeader";
import { getUpcomingMatches, serializeMatch } from "@/lib/matches";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Upcoming Matches" };

export default async function MatchesPage() {
  const [matches, settings] = await Promise.all([
    getUpcomingMatches(),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);
  const serialized = matches.map(serializeMatch);

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Match Center"
        title="Upcoming Matches"
        description="Live availability and countdowns for every fixture still to kick off."
      />
      {serialized.length === 0 ? (
        <EmptyState
          title="No upcoming matches"
          description="Check back soon — new fixtures appear automatically when added."
          action={
            <Link href="/contact">
              <Button variant="gold">Contact us</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {serialized.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              upperPrice={settings?.upperSeatPrice}
              closerPrice={settings?.closerSeatPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
