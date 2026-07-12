import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stadiumZoneSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "zones")) return errorJson("Forbidden", 403);
    const matchId = req.nextUrl.searchParams.get("matchId");
    const zones = await prisma.stadiumZone.findMany({
      where: matchId ? { matchId } : undefined,
      include: { category: true, match: true },
      orderBy: { sortOrder: "asc" },
    });
    return safeJson({ zones });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "zones")) return errorJson("Forbidden", 403);
    const body = await req.json();
    const parsed = stadiumZoneSchema.safeParse(body);
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid", 400);

    const zone = await prisma.stadiumZone.create({
      data: {
        matchId: parsed.data.matchId,
        categoryId: parsed.data.categoryId,
        code: parsed.data.code,
        name: parsed.data.name,
        viewingQuality: parsed.data.viewingQuality || "STANDARD",
        svgPathId: parsed.data.svgPathId,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });
    await logAdminActivity(admin.id, "CREATE_ZONE", "stadium_zone", zone.id);
    return safeJson({ zone }, 201);
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to create zone", 500);
  }
}
