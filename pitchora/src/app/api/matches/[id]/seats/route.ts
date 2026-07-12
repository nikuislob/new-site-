import { prisma } from "@/lib/db";
import { expirePastMatches } from "@/lib/matches";
import { ensureSeatsForMatch } from "@/lib/seats";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await expirePastMatches();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return errorJson("Match not found", 404);
    if (match.kickoffAt <= new Date()) return errorJson("Match expired", 410);

    await ensureSeatsForMatch(id);

    const seats = await prisma.seat.findMany({
      where: {
        matchId: id,
        ...(category ? { category } : {}),
      },
      orderBy: [{ section: "asc" }, { row: "asc" }, { number: "asc" }],
    });

    return safeJson({
      seats: seats.map((s) => ({
        id: s.id,
        section: s.section,
        row: s.row,
        number: s.number,
        category: s.category,
        status: s.status,
      })),
    });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load seats", 500);
  }
}
