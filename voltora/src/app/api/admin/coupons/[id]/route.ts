import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(1).max(40).optional(),
  description: z.string().max(200).optional().nullable(),
  discountType: z.enum(["percent", "fixed"]).optional(),
  discountValue: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "coupons")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.code) data.code = parsed.data.code.toUpperCase();
    if (parsed.data.expiresAt !== undefined) {
      data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    }

    const coupon = await prisma.coupon.update({ where: { id }, data });
    return safeJson({ coupon });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update coupon", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "coupons")) return errorJson("Forbidden", 403);

    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return safeJson({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to delete coupon", 500);
  }
}
