import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  setCustomerSession,
  publicUser,
} from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { registerSchema } from "@/lib/validators";
import { safeJson, errorJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const { email, password, firstName, lastName, phone } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return errorJson("Email already registered", 409);

    const verifyToken = nanoid(32);
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        firstName,
        lastName,
        phone: phone || null,
        emailVerifyToken: verifyToken,
        emailVerifyExpiry: verifyExpiry,
      },
    });

    console.log(`[Voltora Demo] Email verification token for ${user.email}: ${verifyToken}`);

    await setCustomerSession(user.id);
    await mergeGuestCart(user.id);

    return safeJson({ user: publicUser(user), message: "Account created. Please verify your email." }, 201);
  } catch {
    return errorJson("Registration failed", 500);
  }
}
