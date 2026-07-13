import type { Prisma } from "@prisma/client";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson, slugify } from "@/lib/utils";
import { matchSchema } from "@/lib/validators";

async function uniqueSlug(base: string) {
  let slug = base;
  let suffix = 2;
  while (await prisma.match.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) throw new AuthError("Forbidden", 403);

    const matches = await prisma.match.findMany({ orderBy: { kickoffAt: "asc" } });
    return safeJson({ matches });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) throw new AuthError("Forbidden", 403);

    const body = await request.json().catch(() => null);
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid match details.", 422, { issues: parsed.error.issues });
    }

    const kickoffAt = new Date(parsed.data.kickoffAt);
    if (Number.isNaN(kickoffAt.getTime())) return errorJson("Invalid kickoff date.", 422);

    const datePart = kickoffAt.toISOString().slice(0, 10);
    const slug = await uniqueSlug(slugify(`${parsed.data.homeTeam} vs ${parsed.data.awayTeam} ${datePart}`));
    const data: Prisma.MatchCreateInput = {
      slug,
      homeTeam: parsed.data.homeTeam.trim(),
      awayTeam: parsed.data.awayTeam.trim(),
      homeFlag: parsed.data.homeFlag ?? null,
      awayFlag: parsed.data.awayFlag ?? null,
      stage: parsed.data.stage.trim(),
      groupName: parsed.data.groupName ?? null,
      kickoffAt,
      venueName: parsed.data.venueName.trim(),
      venueCity: parsed.data.venueCity.trim(),
      venueState: parsed.data.venueState.trim(),
      venueCapacity: parsed.data.venueCapacity ?? null,
      coverImage: parsed.data.coverImage ?? null,
      description: parsed.data.description ?? null,
      isFeatured: parsed.data.isFeatured ?? false,
      isPublished: parsed.data.isPublished ?? true,
      basicStock: parsed.data.basicStock ?? 500,
      premiumStock: parsed.data.premiumStock ?? 200,
    };

    const match = await prisma.match.create({ data });
    await logAdminActivity(admin.id, "CREATE_MATCH", "Match", match.id, match.slug);
    return safeJson({ match }, 201);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
