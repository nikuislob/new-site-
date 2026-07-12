import { NextRequest } from "next/server";
import {
  hashPassword,
  publicUser,
  recordLoginAttempt,
  setCustomerSession,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Invalid signup data", 400);
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorJson("An account with this email already exists", 409);

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        fullName: parsed.data.fullName.trim(),
        passwordHash,
      },
    });

    await setCustomerSession(user.id);
    await recordLoginAttempt(email, true, "customer", req.headers.get("x-forwarded-for"));

    return safeJson({ user: publicUser(user) }, 201);
  } catch (err) {
    console.error(err);
    return errorJson("Unable to create account", 500);
  }
}
