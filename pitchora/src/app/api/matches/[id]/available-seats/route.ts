import { prisma } from "@/lib/db";
import { expirePastMatches } from "@/lib/matches";
import { getRandomAvailableSeats } from "@/lib/seats";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Returns up to 9 random AVAILABLE seats from the database.
 * Random selection happens server-side only.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await expirePastMatches();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const holdToken = searchParams.get("holdToken");

    const match = await prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) return errorJson("Match not found", 404);
    if (match.kickoffAt <= new Date() || match.status === "COMPLETED") {
      return errorJson("This match is no longer available", 410);
    }

    const result = await getRandomAvailableSeats({
      matchId: id,
      category,
      holdToken,
    });

    return safeJson({
      matchId: id,
      category: category || null,
      ...result,
      match: {
        id: match.id,
        stadium: match.stadium,
        kickoffAt: match.kickoffAt.toISOString(),
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
      },
    });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load available seats", 500);
  }
}
