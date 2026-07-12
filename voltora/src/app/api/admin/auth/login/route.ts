import { NextRequest } from "next/server";
import {
  checkLoginRateLimit,
  logAdminActivity,
  recordLoginAttempt,
  setAdminSession,
  verifyPassword,
  publicAdmin,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid credentials", 400);

    const email = parsed.data.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for") || null;
    const rate = await checkLoginRateLimit(email, "admin", ip);
    if (!rate.allowed) {
      return errorJson(`Too many attempts. Try again in ${rate.retryAfterMinutes} minutes.`, 429);
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      await recordLoginAttempt(email, false, "admin", ip);
      return errorJson("Invalid email or password", 401);
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      return errorJson("Account temporarily locked. Try again later.", 423);
    }

    const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!ok) {
      const fails = admin.failedLogins + 1;
      const updates: { failedLogins: number; lockedUntil?: Date } = { failedLogins: fails };
      if (fails >= Number(process.env.LOGIN_MAX_ATTEMPTS || 5)) {
        updates.lockedUntil = new Date(
          Date.now() + Number(process.env.LOGIN_LOCKOUT_MINUTES || 15) * 60 * 1000
        );
      }
      await prisma.adminUser.update({ where: { id: admin.id }, data: updates });
      await recordLoginAttempt(email, false, "admin", ip);
      return errorJson("Invalid email or password", 401);
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await setAdminSession(admin.id, admin.role);
    await recordLoginAttempt(email, true, "admin", ip);
    await logAdminActivity(admin.id, "LOGIN", "admin", admin.id, undefined, ip);

    return safeJson({ admin: publicAdmin(admin) });
  } catch {
    return errorJson("Unable to sign in", 500);
  }
}
