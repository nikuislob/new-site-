import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { matchSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: { categories: true, zones: true },
    });
    if (!match) return errorJson("Not found", 404);
    return safeJson({ match });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = matchSchema.partial().safeParse(body);
    if (!parsed.success) return errorJson("Invalid data", 400);

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.matchDate) data.matchDate = new Date(parsed.data.matchDate);
    if (parsed.data.teamAFlagUrl === "") data.teamAFlagUrl = null;
    if (parsed.data.teamBFlagUrl === "") data.teamBFlagUrl = null;
    if (parsed.data.heroImageUrl === "") data.heroImageUrl = null;

    const match = await prisma.match.update({ where: { id }, data });
    await logAdminActivity(admin.id, "UPDATE_MATCH", "match", id, JSON.stringify(parsed.data));
    return safeJson({ match });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to update match", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches") || admin.role === "SUPPORT_AGENT") {
      return errorJson("Forbidden", 403);
    }
    const { id } = await ctx.params;
    await prisma.match.delete({ where: { id } });
    await logAdminActivity(admin.id, "DELETE_MATCH", "match", id);
    return safeJson({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to delete match", 500);
  }
}
