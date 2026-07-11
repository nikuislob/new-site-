import { NextRequest } from "next/server";
import { requireAdmin, hashPassword, publicAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";
import type { AdminRole } from "@/lib/auth";

const createSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
  name: z.string().min(1).max(100),
  role: z.enum(["SUPER_ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER", "SUPPORT_AGENT"]),
});

export async function GET() {
  try {
    await requireAdmin(["SUPER_ADMIN"]);

    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        totpEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return safeJson({ admins });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch admins", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(["SUPER_ADMIN"]);

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const existing = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (existing) return errorJson("Email already in use", 409);

    const admin = await prisma.adminUser.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name,
        role: parsed.data.role as AdminRole,
      },
    });

    return safeJson({ admin: publicAdmin(admin) }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to create admin", 500);
  }
}
