import { z } from "zod";
import { adminCan, AuthError, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson, slugify } from "@/lib/utils";

const schema = z.object({
  id: z.string().optional(),
  round: z.string().min(2),
  homeTeam: z.string().min(2),
  awayTeam: z.string().min(2),
  kickoffAt: z.string().datetime(),
  venueId: z.string().min(1),
  status: z.enum(["SCHEDULED", "TIMED", "POSTPONED", "IN_PLAY", "FINISHED", "CANCELLED"]).default("SCHEDULED"),
  isVisible: z.boolean().default(true),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) return errorJson("Forbidden", 403);
    const matches = await prisma.eventMatch.findMany({
      include: { venue: true, _count: { select: { listings: true, bookings: true } } },
      orderBy: { kickoffAt: "asc" },
    });
    const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });
    return safeJson({ matches, venues });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to load matches", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) return errorJson("Forbidden", 403);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid match", 400);
    const { id, ...input } = parsed.data;
    const match = id
      ? await prisma.eventMatch.update({ where: { id }, data: { ...input, kickoffAt: new Date(input.kickoffAt) } })
      : await prisma.eventMatch.create({
          data: {
            ...input,
            kickoffAt: new Date(input.kickoffAt),
            slug: `${slugify(input.homeTeam)}-vs-${slugify(input.awayTeam)}-${Date.now().toString(36)}`,
          },
        });
    await logAdminActivity(admin.id, id ? "MATCH_UPDATED" : "MATCH_CREATED", "EventMatch", match.id);
    return safeJson({ match }, id ? 200 : 201);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to save match", 500);
  }
}
