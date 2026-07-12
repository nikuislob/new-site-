import { prisma } from "@/lib/db";
import { MatchesAdmin } from "@/components/admin/MatchesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { matchDate: "asc" },
    include: { _count: { select: { seats: true, orders: true } } },
  });

  return (
    <MatchesAdmin
      initialMatches={matches.map((m) => ({
        ...m,
        matchDate: m.matchDate.toISOString(),
      }))}
    />
  );
}
