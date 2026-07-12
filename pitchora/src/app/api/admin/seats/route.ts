import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { releaseExpiredHolds } from "@/lib/seats";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    await releaseExpiredHolds();

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    const status = searchParams.get("status");

    const seats = await prisma.seat.findMany({
      where: {
        ...(matchId ? { matchId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: [{ matchId: "asc" }, { section: "asc" }, { row: "asc" }, { number: "asc" }],
      take: 500,
    });

    const counts = await prisma.seat.groupBy({
      by: ["status"],
      ...(matchId ? { where: { matchId } } : {}),
      _count: { _all: true },
    });

    return safeJson({
      seats,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    console.error(e);
    return errorJson("Failed to load seats", 500);
  }
}
