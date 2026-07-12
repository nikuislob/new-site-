import { NextRequest } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paymentLinkSchema } from "@/lib/validators";
import { errorJson, formatCurrency, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: { in: ["pending_link", "awaiting_payment", "completed"] },
      },
      include: { match: true },
      orderBy: { createdAt: "desc" },
    });

    return safeJson({
      orders: orders.map((o) => ({
        ...o,
        totalPrice: Number(o.totalPrice),
        totalFormatted: formatCurrency(Number(o.totalPrice)),
        matchDate: o.match.matchDate.toISOString(),
        matchLabel: `${o.match.homeTeam} vs ${o.match.awayTeam}`,
        venue: o.match.venue,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to load orders", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { orderId, action } = body as {
      orderId?: string;
      action?: "send_link" | "mark_received";
      paymentLink?: string;
    };

    if (!orderId || !action) return errorJson("orderId and action required", 400);

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) return errorJson("Order not found", 404);

    if (action === "send_link") {
      const parsed = paymentLinkSchema.safeParse({ paymentLink: body.paymentLink });
      if (!parsed.success) return errorJson("Valid payment link URL required", 400);

      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentLinkSent: parsed.data.paymentLink,
          paymentStatus: "awaiting_payment",
        },
        include: { match: true },
      });

      return safeJson({
        order,
        notice: `Payment link saved. Customer (${order.customerEmail}) should use the Apple Pay / Cash App link.`,
      });
    }

    if (action === "mark_received") {
      if (!["pending_link", "awaiting_payment"].includes(existing.paymentStatus)) {
        return errorJson("Order cannot be marked received in its current state", 400);
      }
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "completed" },
        include: { match: true },
      });
      return safeJson({ order });
    }

    return errorJson("Unknown action", 400);
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    console.error(err);
    return errorJson("Failed to update order", 500);
  }
}
