import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  setAdminSession,
  publicAdmin,
  checkLoginRateLimit,
  recordLoginAttempt,
  logAdminActivity,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { safeJson, errorJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const { email, password } = parsed.data;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const rateLimit = await checkLoginRateLimit(email, "admin", ip);
    if (!rateLimit.allowed) {
      return errorJson(`Too many login attempts. Try again in ${rateLimit.retryAfterMinutes} minutes.`, 429);
    }

    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !admin.isActive) {
      await recordLoginAttempt(email, false, "admin", ip);
      return errorJson("Invalid credentials", 401);
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      return errorJson("Account temporarily locked", 423);
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, false, "admin", ip);
      const failed = admin.failedLogins + 1;
      const lockout = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { failedLogins: failed, lockedUntil: lockout },
      });
      return errorJson("Invalid credentials", 401);
    }

    await recordLoginAttempt(email, true, "admin", ip);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await setAdminSession(admin.id, admin.role);
    await logAdminActivity(admin.id, "login", "admin", admin.id, undefined, ip);

    return safeJson({ admin: publicAdmin(admin) });
  } catch {
    return errorJson("Login failed", 500);
  }
}
