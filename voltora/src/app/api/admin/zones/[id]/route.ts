import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stadiumZoneSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "zones")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = stadiumZoneSchema.partial().omit({ matchId: true }).safeParse(body);
    if (!parsed.success) return errorJson("Invalid data", 400);
    const zone = await prisma.stadiumZone.update({ where: { id }, data: parsed.data });
    await logAdminActivity(admin.id, "UPDATE_ZONE", "stadium_zone", id);
    return safeJson({ zone });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "zones")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    await prisma.stadiumZone.delete({ where: { id } });
    await logAdminActivity(admin.id, "DELETE_ZONE", "stadium_zone", id);
    return safeJson({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
