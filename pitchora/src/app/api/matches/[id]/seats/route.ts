import { prisma } from "@/lib/db";
import { expirePastMatches } from "@/lib/matches";
import { getRandomAvailableSeats } from "@/lib/seats";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Public seats endpoint — does NOT return full inventory.
 * Returns up to 9 random available seats (server-side).
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await expirePastMatches();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const holdToken = searchParams.get("holdToken");

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return errorJson("Match not found", 404);
    if (match.kickoffAt <= new Date()) return errorJson("Match expired", 410);

    const result = await getRandomAvailableSeats({ matchId: id, category, holdToken });
    return safeJson(result);
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load seats", 500);
  }
}
