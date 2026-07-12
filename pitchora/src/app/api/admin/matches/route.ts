import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { expirePastMatches } from "@/lib/matches";
import { ensureSeatsForMatch } from "@/lib/seats";
import { matchSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await expirePastMatches();
    const matches = await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: "asc" },
    });
    return safeJson({ matches });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to load matches", 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = matchSchema.safeParse({
      ...body,
      upperSeatsTotal: Number(body.upperSeatsTotal),
      closerSeatsTotal: Number(body.closerSeatsTotal),
    });
    if (!parsed.success) return errorJson("Invalid match data", 400, { issues: parsed.error.issues });

    if (parsed.data.homeTeamId === parsed.data.awayTeamId) {
      return errorJson("Home and away teams must differ", 400);
    }

    const match = await prisma.match.create({
      data: {
        homeTeamId: parsed.data.homeTeamId,
        awayTeamId: parsed.data.awayTeamId,
        kickoffAt: new Date(parsed.data.kickoffAt),
        stadium: parsed.data.stadium,
        country: parsed.data.country,
        city: parsed.data.city || null,
        stadiumImageUrl: parsed.data.stadiumImageUrl || "/stadium-hero.svg",
        upperSeatsTotal: parsed.data.upperSeatsTotal,
        closerSeatsTotal: parsed.data.closerSeatsTotal,
        isFeatured: parsed.data.isFeatured ?? false,
        status: "UPCOMING",
      },
      include: { homeTeam: true, awayTeam: true },
    });

    await ensureSeatsForMatch(match.id);
    return safeJson({ match }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    console.error(e);
    return errorJson("Failed to create match", 500);
  }
}
