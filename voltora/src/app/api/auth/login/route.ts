import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  setCustomerSession,
  publicUser,
  checkLoginRateLimit,
  recordLoginAttempt,
  AuthError,
} from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
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

    const rateLimit = await checkLoginRateLimit(email, "customer", ip);
    if (!rateLimit.allowed) {
      return errorJson(`Too many login attempts. Try again in ${rateLimit.retryAfterMinutes} minutes.`, 429);
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      await recordLoginAttempt(email, false, "customer", ip);
      return errorJson("Invalid email or password", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt(email, false, "customer", ip);
      return errorJson("Invalid email or password", 401);
    }

    await recordLoginAttempt(email, true, "customer", ip);
    await setCustomerSession(user.id);
    await mergeGuestCart(user.id);

    return safeJson({ user: publicUser(user) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Login failed", 500);
  }
}
