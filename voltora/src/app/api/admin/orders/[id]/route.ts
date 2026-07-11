import { NextRequest } from "next/server";
import { requireAdmin, adminCan, logAdminActivity, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const patchSchema = z.object({
  status: z
    .enum([
      "ORDER_CREATED",
      "PAYMENT_PENDING",
      "PAYMENT_CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
      "AWAITING_ASSISTED_PAYMENT",
    ])
    .optional(),
  paymentStatus: z.enum(["PENDING", "CONFIRMED", "FAILED", "REFUNDED", "AWAITING_ASSISTED"]).optional(),
  trackingNumber: z.string().max(100).optional().nullable(),
  shippingCarrier: z.string().max(80).optional().nullable(),
  adminNotes: z.string().max(2000).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders:read")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: true,
        paymentMethod: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!order) return errorJson("Order not found", 404);
    return safeJson({ order });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch order", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const existing = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });
    if (!existing) return errorJson("Order not found", 404);

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    if (parsed.data.paymentStatus === "CONFIRMED" && existing.paymentStatus !== "CONFIRMED") {
      const order = await confirmOrderPayment({
        orderId: existing.id,
        adminNotesAppend: parsed.data.adminNotes
          ? `Admin note: ${parsed.data.adminNotes}`
          : `Manual payment confirm by ${admin.email}`,
      });
      const extra: Record<string, unknown> = {};
      if (parsed.data.status && parsed.data.status !== "PAYMENT_CONFIRMED") extra.status = parsed.data.status;
      if (parsed.data.trackingNumber !== undefined) extra.trackingNumber = parsed.data.trackingNumber;
      if (parsed.data.shippingCarrier !== undefined) extra.shippingCarrier = parsed.data.shippingCarrier;
      if (Object.keys(extra).length) {
        await prisma.order.update({ where: { id: order.id }, data: extra });
      }
      await logAdminActivity(admin.id, "confirm_payment", "order", order.id, JSON.stringify(parsed.data), ip);
      const full = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, paymentMethod: true },
      });
      return safeJson({ order: full });
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: parsed.data,
      include: { items: true, paymentMethod: true },
    });

    await logAdminActivity(admin.id, "update_order", "order", order.id, JSON.stringify(parsed.data), ip);
    return safeJson({ order });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson(e instanceof Error ? e.message : "Failed to update order", 400);
  }
}
