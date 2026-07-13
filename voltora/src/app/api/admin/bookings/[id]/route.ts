import { z } from "zod";
import { adminCan, AuthError, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

const schema = z.object({
  status: z.enum(["AWAITING_PAYMENT", "PAYMENT_PROCESSING", "AWAITING_PAYMENT_CONFIRMATION", "PAID", "CONFIRMED", "TICKET_DELIVERY_PENDING", "TICKET_DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED"]).optional(),
  deliveryStatus: z.enum(["PENDING", "READY", "DELIVERED"]).optional(),
  deliveryNotes: z.string().max(2000).optional(),
  mobileInstructions: z.string().max(4000).optional(),
});
type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "bookings") && !adminCan(admin.role, "orders:read")) return errorJson("Forbidden", 403);
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { match: { include: { venue: true } }, items: true, payments: true, deliveries: true, conversations: true },
    });
    return booking ? safeJson({ booking }) : errorJson("Booking not found", 404);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to load booking", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "bookings")) return errorJson("Forbidden", 403);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid update", 400);
    const { id } = await params;
    const { deliveryStatus, deliveryNotes, mobileInstructions, ...bookingData } = parsed.data;
    const booking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id },
        data: {
          ...bookingData,
          ...(bookingData.paymentStatus === "PAID" ? { paidAt: new Date(), status: bookingData.status || "PAID" } : {}),
        },
      });
      if (bookingData.paymentStatus === "PAID") {
        const latestPayment = await tx.payment.findFirst({
          where: { bookingId: id },
          orderBy: { createdAt: "desc" },
        });
        if (latestPayment && latestPayment.status !== "SUCCEEDED") {
          await tx.payment.update({
            where: { id: latestPayment.id },
            data: { status: "MANUALLY_CONFIRMED" },
          });
        }
      }
      if (deliveryStatus || deliveryNotes !== undefined || mobileInstructions !== undefined) {
        const current = await tx.ticketDelivery.findFirst({ where: { bookingId: id } });
        const delivery = current
          ? await tx.ticketDelivery.update({ where: { id: current.id }, data: { status: deliveryStatus, deliveryNotes, mobileInstructions, ...(deliveryStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}) } })
          : await tx.ticketDelivery.create({ data: { bookingId: id, method: updated.deliveryMethod, status: deliveryStatus || "PENDING", deliveryNotes, mobileInstructions, ...(deliveryStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}) } });
        if (delivery.status === "DELIVERED") await tx.booking.update({ where: { id }, data: { status: "TICKET_DELIVERED" } });
      }
      return updated;
    });
    await logAdminActivity(admin.id, "BOOKING_UPDATED", "Booking", id, JSON.stringify(parsed.data));
    return safeJson({ booking });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to update booking", 500);
  }
}
