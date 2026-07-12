import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const paymentStatus = body.paymentStatus as string | undefined;
    if (!paymentStatus || !["PENDING", "PAID", "FAILED", "CANCELLED"].includes(paymentStatus)) {
      return errorJson("Invalid payment status", 400);
    }

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id } });
      if (!existing) throw new Error("NOT_FOUND");

      const updated = await tx.order.update({
        where: { id },
        data: { paymentStatus },
      });

      if (paymentStatus === "PAID") {
        const alreadySold = existing.paymentStatus === "PAID";
        await tx.seat.updateMany({
          where: { orderId: id },
          data: { status: "SOLD", holdToken: null, holdExpiresAt: null },
        });
        if (!alreadySold) {
          const qty = updated.quantity;
          if (updated.ticketCategory === "UPPER") {
            await tx.match.update({
              where: { id: updated.matchId },
              data: { upperSeatsSold: { increment: qty } },
            });
          } else {
            await tx.match.update({
              where: { id: updated.matchId },
              data: { closerSeatsSold: { increment: qty } },
            });
          }
        }
      } else if (paymentStatus === "CANCELLED" || paymentStatus === "FAILED") {
        const seats = await tx.seat.findMany({ where: { orderId: id } });
        const wasPaid = existing.paymentStatus === "PAID";
        await tx.seat.updateMany({
          where: { orderId: id },
          data: {
            status: "AVAILABLE",
            orderId: null,
            holdToken: null,
            holdExpiresAt: null,
          },
        });
        if (wasPaid && seats.length > 0) {
          if (updated.ticketCategory === "UPPER") {
            await tx.match.update({
              where: { id: updated.matchId },
              data: { upperSeatsSold: { decrement: seats.length } },
            });
          } else {
            await tx.match.update({
              where: { id: updated.matchId },
              data: { closerSeatsSold: { decrement: seats.length } },
            });
          }
        }
      }

      return updated;
    });

    return safeJson({ order });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    if (e instanceof Error && e.message === "NOT_FOUND") return errorJson("Order not found", 404);
    return errorJson("Failed to update order", 500);
  }
}
