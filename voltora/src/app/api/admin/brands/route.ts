import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify, safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const brandSchema = z.object({
  name: z.string().min(1).max(100),
  logoUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "brands")) return errorJson("Forbidden", 403);

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });

    return safeJson({ brands });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch brands", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "brands")) return errorJson("Forbidden", 403);

    const body = await req.json();
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const brand = await prisma.brand.create({
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        logoUrl: parsed.data.logoUrl || null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return safeJson({ brand }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to create brand", 500);
  }
}
