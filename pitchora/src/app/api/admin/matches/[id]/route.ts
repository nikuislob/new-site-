import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { matchSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = matchSchema.partial().safeParse({
      ...body,
      upperSeatsTotal: body.upperSeatsTotal !== undefined ? Number(body.upperSeatsTotal) : undefined,
      closerSeatsTotal: body.closerSeatsTotal !== undefined ? Number(body.closerSeatsTotal) : undefined,
    });
    if (!parsed.success) return errorJson("Invalid match data", 400, { issues: parsed.error.issues });

    const data = parsed.data;
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(data.homeTeamId ? { homeTeamId: data.homeTeamId } : {}),
        ...(data.awayTeamId ? { awayTeamId: data.awayTeamId } : {}),
        ...(data.kickoffAt ? { kickoffAt: new Date(data.kickoffAt) } : {}),
        ...(data.stadium ? { stadium: data.stadium } : {}),
        ...(data.country ? { country: data.country } : {}),
        ...(data.city !== undefined ? { city: data.city || null } : {}),
        ...(data.stadiumImageUrl !== undefined ? { stadiumImageUrl: data.stadiumImageUrl } : {}),
        ...(data.upperSeatsTotal !== undefined ? { upperSeatsTotal: data.upperSeatsTotal } : {}),
        ...(data.closerSeatsTotal !== undefined ? { closerSeatsTotal: data.closerSeatsTotal } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      },
      include: { homeTeam: true, awayTeam: true },
    });

    return safeJson({ match });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    console.error(e);
    return errorJson("Failed to update match", 500);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.seat.deleteMany({ where: { matchId: id } });
    await prisma.match.delete({ where: { id } });
    return safeJson({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to delete match", 500);
  }
}
