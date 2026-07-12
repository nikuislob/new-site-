import { NextRequest } from "next/server";
import {
  checkLoginRateLimit,
  publicUser,
  recordLoginAttempt,
  setCustomerSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { customerLoginSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = customerLoginSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid credentials", 400);

    const email = parsed.data.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for");
    const rate = await checkLoginRateLimit(email, "customer", ip);
    if (!rate.allowed) {
      return errorJson(`Too many attempts. Try again in ${rate.retryAfterMinutes} minutes.`, 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      await recordLoginAttempt(email, false, "customer", ip);
      return errorJson("Invalid email or password", 401);
    }

    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) {
      await recordLoginAttempt(email, false, "customer", ip);
      return errorJson("Invalid email or password", 401);
    }

    await setCustomerSession(user.id);
    await recordLoginAttempt(email, true, "customer", ip);
    return safeJson({ user: publicUser(user) });
  } catch {
    return errorJson("Unable to sign in", 500);
  }
}
