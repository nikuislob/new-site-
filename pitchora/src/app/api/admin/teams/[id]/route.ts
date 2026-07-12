import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teamSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = teamSchema.partial().safeParse(body);
    if (!parsed.success) return errorJson("Invalid team", 400);
    const team = await prisma.team.update({ where: { id }, data: parsed.data });
    return safeJson({ team });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update team", 500);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.team.delete({ where: { id } });
    return safeJson({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to delete team", 500);
  }
}
