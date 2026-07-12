import { NextRequest } from "next/server";
import { AuthError, requireAdmin, setAdminSession, verifyPassword, clearAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid credentials", 400);

    const admin = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!admin || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
      return errorJson("Invalid email or password", 401);
    }

    await setAdminSession(admin.id);
    return safeJson({
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error(err);
    return errorJson("Login failed", 500);
  }
}

export async function DELETE() {
  try {
    await clearAdminSession();
    return safeJson({ ok: true });
  } catch {
    return errorJson("Logout failed", 500);
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    return safeJson({ admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Unauthorized", 401);
  }
}
