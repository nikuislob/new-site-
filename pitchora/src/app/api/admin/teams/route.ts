import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        homeMatches: { where: { kickoffAt: { gt: new Date() } }, select: { id: true } },
        awayMatches: { where: { kickoffAt: { gt: new Date() } }, select: { id: true } },
      },
    });
    return safeJson({
      teams: teams.map((t) => ({
        ...t,
        upcomingCount: t.homeMatches.length + t.awayMatches.length,
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to load teams", 500);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = teamSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid team", 400, { issues: parsed.error.issues });
    const team = await prisma.team.create({ data: parsed.data });
    return safeJson({ team }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to create team", 500);
  }
}
