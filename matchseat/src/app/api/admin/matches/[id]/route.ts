import { Prisma } from "@prisma/client";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson, slugify } from "@/lib/utils";
import { matchSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function uniqueSlug(base: string, excludeId: string) {
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await prisma.match.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function requireMatchAdmin() {
  const admin = await requireAdmin();
  if (!adminCan(admin.role, "matches")) throw new AuthError("Forbidden", 403);
  return admin;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireMatchAdmin();
    const { id } = await context.params;
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return errorJson("Match not found.", 404);
    return safeJson({ match });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await requireMatchAdmin();
    const { id } = await context.params;
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return errorJson("Match not found.", 404);

    const body = await request.json().catch(() => null);
    const parsed = matchSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid match details.", 422, { issues: parsed.error.issues });
    }

    const data: Prisma.MatchUpdateInput = {};
    if (parsed.data.homeTeam !== undefined) data.homeTeam = parsed.data.homeTeam.trim();
    if (parsed.data.awayTeam !== undefined) data.awayTeam = parsed.data.awayTeam.trim();
    if (parsed.data.homeFlag !== undefined) data.homeFlag = parsed.data.homeFlag;
    if (parsed.data.awayFlag !== undefined) data.awayFlag = parsed.data.awayFlag;
    if (parsed.data.stage !== undefined) data.stage = parsed.data.stage.trim();
    if (parsed.data.groupName !== undefined) data.groupName = parsed.data.groupName;
    if (parsed.data.venueName !== undefined) data.venueName = parsed.data.venueName.trim();
    if (parsed.data.venueCity !== undefined) data.venueCity = parsed.data.venueCity.trim();
    if (parsed.data.venueState !== undefined) data.venueState = parsed.data.venueState.trim();
    if (parsed.data.venueCapacity !== undefined) data.venueCapacity = parsed.data.venueCapacity;
    if (parsed.data.coverImage !== undefined) data.coverImage = parsed.data.coverImage;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.isFeatured !== undefined) data.isFeatured = parsed.data.isFeatured;
    if (parsed.data.isPublished !== undefined) data.isPublished = parsed.data.isPublished;
    if (parsed.data.basicStock !== undefined) data.basicStock = parsed.data.basicStock;
    if (parsed.data.premiumStock !== undefined) data.premiumStock = parsed.data.premiumStock;

    let kickoffAt = existing.kickoffAt;
    if (parsed.data.kickoffAt !== undefined) {
      kickoffAt = new Date(parsed.data.kickoffAt);
      if (Number.isNaN(kickoffAt.getTime())) return errorJson("Invalid kickoff date.", 422);
      data.kickoffAt = kickoffAt;
    }

    if (
      parsed.data.homeTeam !== undefined ||
      parsed.data.awayTeam !== undefined ||
      parsed.data.kickoffAt !== undefined
    ) {
      const homeTeam = parsed.data.homeTeam ?? existing.homeTeam;
      const awayTeam = parsed.data.awayTeam ?? existing.awayTeam;
      const datePart = kickoffAt.toISOString().slice(0, 10);
      data.slug = await uniqueSlug(slugify(`${homeTeam} vs ${awayTeam} ${datePart}`), id);
    }

    const match = await prisma.match.update({ where: { id }, data });
    await logAdminActivity(admin.id, "UPDATE_MATCH", "Match", match.id, match.slug);
    return safeJson({ match });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await requireMatchAdmin();
    const { id } = await context.params;
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return errorJson("Match not found.", 404);

    try {
      await prisma.match.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return errorJson("Match has orders and cannot be deleted.", 409);
      }
      throw error;
    }

    await logAdminActivity(admin.id, "DELETE_MATCH", "Match", id, existing.slug);
    return safeJson({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
