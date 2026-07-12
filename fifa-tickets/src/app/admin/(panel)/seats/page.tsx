import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { SeatsAdmin } from "@/components/admin/SeatsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminSeatsPage() {
  const matches = await prisma.match.findMany({ orderBy: { matchDate: "asc" } });
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SeatsAdmin
        matches={matches.map((m) => ({
          id: m.id,
          label: `${m.homeTeam} vs ${m.opponent} — ${m.stadiumName}`,
        }))}
      />
    </Suspense>
  );
}
