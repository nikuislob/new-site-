import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z
  .object({
    status: z.string().min(1).max(40).optional(),
    paymentStatus: z.string().min(1).max(40).optional(),
  })
  .refine((data) => data.status || data.paymentStatus, {
    message: "status or paymentStatus is required.",
  });

const orderInclude = {
  user: true,
  paymentMethod: true,
  items: { include: { match: true } },
};

const STOCK_CONSUMING = new Set(["PAYMENT_PENDING", "PAYMENT_CONFIRMED", "FULFILLED"]);

async function findOrder(id: string) {
  return prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: orderInclude,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders:read")) throw new AuthError("Forbidden", 403);

    const { id } = await context.params;
    const order = await findOrder(id);
    if (!order) return errorJson("Order not found.", 404);
    return safeJson({ order });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders")) throw new AuthError("Forbidden", 403);

    const { id } = await context.params;
    const existing = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true },
    });
    if (!existing) return errorJson("Order not found.", 404);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid order update.", 422, { issues: parsed.error.issues });
    }

    let nextStatus = parsed.data.status?.trim().toUpperCase();
    const nextPaymentStatus = parsed.data.paymentStatus?.trim().toUpperCase();

    if (nextPaymentStatus === "CONFIRMED" || nextPaymentStatus === "PAID") {
      // Confirm payment without downgrading a fulfilled order.
      if (existing.status !== "FULFILLED" && existing.status !== "CANCELLED" && existing.status !== "FAILED") {
        nextStatus = nextStatus || "PAYMENT_CONFIRMED";
      }
    }

    const becomingCancelled =
      (nextStatus === "CANCELLED" || nextStatus === "FAILED") &&
      STOCK_CONSUMING.has(existing.status) &&
      existing.status !== "CANCELLED" &&
      existing.status !== "FAILED";

    const order = await prisma.$transaction(async (tx) => {
      if (becomingCancelled) {
        for (const item of existing.items) {
          if (item.seatTier === "BASIC") {
            await tx.match.update({
              where: { id: item.matchId },
              data: { basicStock: { increment: item.quantity } },
            });
          } else if (item.seatTier === "PREMIUM") {
            await tx.match.update({
              where: { id: item.matchId },
              data: { premiumStock: { increment: item.quantity } },
            });
          }
        }
      }

      const data: Prisma.OrderUpdateInput = {};
      if (nextStatus) data.status = nextStatus;
      if (nextPaymentStatus) data.paymentStatus = nextPaymentStatus;

      return tx.order.update({
        where: { id: existing.id },
        data,
        include: orderInclude,
      });
    });

    await logAdminActivity(admin.id, "UPDATE_ORDER", "Order", order.id, order.orderNumber);
    return safeJson({ order });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
