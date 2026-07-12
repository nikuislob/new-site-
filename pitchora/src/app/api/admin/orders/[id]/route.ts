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
      const updated = await tx.order.update({
        where: { id },
        data: { paymentStatus },
      });

      if (paymentStatus === "PAID") {
        await tx.seat.updateMany({ where: { orderId: id }, data: { status: "SOLD" } });
      } else if (paymentStatus === "CANCELLED" || paymentStatus === "FAILED") {
        const seats = await tx.seat.findMany({ where: { orderId: id } });
        await tx.seat.updateMany({
          where: { orderId: id },
          data: { status: "AVAILABLE", orderId: null },
        });
        if (seats.length > 0) {
          const category = updated.ticketCategory;
          if (category === "UPPER") {
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
    return errorJson("Failed to update order", 500);
  }
}
