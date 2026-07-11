import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(1).max(40),
  description: z.string().max(200).optional().nullable(),
  discountType: z.enum(["percent", "fixed"]).optional(),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "coupons")) return errorJson("Forbidden", 403);

    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return safeJson({ coupons });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch coupons", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "coupons")) return errorJson("Forbidden", 403);

    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: parsed.data.code.toUpperCase(),
        description: parsed.data.description || null,
        discountType: parsed.data.discountType || "percent",
        discountValue: parsed.data.discountValue,
        minOrderAmount: parsed.data.minOrderAmount ?? 0,
        maxUses: parsed.data.maxUses ?? null,
        isActive: parsed.data.isActive ?? true,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    return safeJson({ coupon }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to create coupon", 500);
  }
}
