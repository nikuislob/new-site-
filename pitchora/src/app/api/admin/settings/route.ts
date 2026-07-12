import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { settingsSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    return safeJson({ settings });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to load settings", 500);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid settings", 400, { issues: parsed.error.issues });

    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: parsed.data,
    });
    return safeJson({ settings });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    console.error(e);
    return errorJson("Failed to update settings", 500);
  }
}
