import { prisma } from "@/lib/db";
import { availableSeats, expirePastMatches, serializeMatch } from "@/lib/matches";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await expirePastMatches();
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) return errorJson("Match not found", 404);
    if (match.kickoffAt <= new Date() || match.status === "COMPLETED") {
      return errorJson("This match is no longer available", 410);
    }
    return safeJson({ match: serializeMatch(match), availability: availableSeats(match) });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load match", 500);
  }
}
