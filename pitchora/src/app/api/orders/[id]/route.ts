import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
        seats: true,
      },
    });
    if (!order) return errorJson("Order not found", 404);

    return safeJson({
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        match: {
          ...order.match,
          kickoffAt: order.match.kickoffAt.toISOString(),
          createdAt: order.match.createdAt.toISOString(),
          updatedAt: order.match.updatedAt.toISOString(),
          homeTeam: {
            ...order.match.homeTeam,
            createdAt: order.match.homeTeam.createdAt.toISOString(),
            updatedAt: order.match.homeTeam.updatedAt.toISOString(),
          },
          awayTeam: {
            ...order.match.awayTeam,
            createdAt: order.match.awayTeam.createdAt.toISOString(),
            updatedAt: order.match.awayTeam.updatedAt.toISOString(),
          },
        },
      },
    });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load order", 500);
  }
}

/**
 * Confirm payment server-side. Seats become SOLD only here.
 * Idempotent: PAID orders return success without double-selling.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { seats: true },
    });
    if (!order) return errorJson("Order not found", 404);

    if (action === "confirm-payment") {
      if (order.paymentStatus === "PAID") {
        return safeJson({ order: { id: order.id, paymentStatus: "PAID" }, idempotent: true });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current) throw new Error("MISSING");
        if (current.paymentStatus === "PAID") return current;

        const o = await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID" },
        });

        await tx.seat.updateMany({
          where: { orderId: order.id },
          data: {
            status: "SOLD",
            holdToken: null,
            holdExpiresAt: null,
          },
        });

        const qty = o.quantity;
        if (o.ticketCategory === "UPPER") {
          await tx.match.update({
            where: { id: o.matchId },
            data: { upperSeatsSold: { increment: qty } },
          });
        } else {
          await tx.match.update({
            where: { id: o.matchId },
            data: { closerSeatsSold: { increment: qty } },
          });
        }

        return o;
      });

      return safeJson({ order: { id: updated.id, paymentStatus: updated.paymentStatus } });
    }

    if (action === "cancel-payment") {
      if (order.paymentStatus === "PAID") {
        return errorJson("Paid orders cannot be cancelled here", 400);
      }
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "CANCELLED" },
        });
        await tx.seat.updateMany({
          where: { orderId: order.id, status: { in: ["HELD", "RESERVED"] } },
          data: {
            status: "AVAILABLE",
            holdToken: null,
            holdExpiresAt: null,
            orderId: null,
          },
        });
      });
      return safeJson({ ok: true });
    }

    return errorJson("Unknown action", 400);
  } catch (e) {
    console.error(e);
    return errorJson("Failed to update order", 500);
  }
}
