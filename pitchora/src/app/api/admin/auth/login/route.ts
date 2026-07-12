import { prisma } from "@/lib/db";
import { publicAdmin, setAdminSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid credentials", 400);

    const admin = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!admin || !admin.isActive) return errorJson("Invalid email or password", 401);

    const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!ok) return errorJson("Invalid email or password", 401);

    await setAdminSession(admin.id, admin.role);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return safeJson({ admin: publicAdmin(admin) });
  } catch (e) {
    console.error(e);
    return errorJson("Login failed", 500);
  }
}
