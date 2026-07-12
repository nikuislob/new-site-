import { publicAdmin, setAdminSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";
import { loginSchema } from "@/lib/validators";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Invalid login details.", 422, { issues: parsed.error.issues });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return errorJson("Invalid email or password.", 401);

  const now = new Date();
  if (admin.lockedUntil && admin.lockedUntil > now) {
    return errorJson("Account is temporarily locked. Try again later.", 423, {
      lockedUntil: admin.lockedUntil,
    });
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    const failedLogins = admin.failedLogins + 1;
    const lockedUntil =
      failedLogins >= MAX_FAILED_LOGINS
        ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
        : null;

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLogins, lockedUntil },
    });

    if (lockedUntil) {
      return errorJson("Account is temporarily locked. Try again later.", 423, { lockedUntil });
    }
    return errorJson("Invalid email or password.", 401);
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: now },
  });

  await setAdminSession(updated.id, updated.role);
  return safeJson({ admin: publicAdmin(updated) });
}
