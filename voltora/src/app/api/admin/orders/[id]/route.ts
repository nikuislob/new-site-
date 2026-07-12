import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { releaseReservation } from "@/lib/inventory";
import { issueTicketsForOrder } from "@/lib/tickets";
import { orderStatusUpdateSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders") && !adminCan(admin.role, "orders:read")) {
      return errorJson("Forbidden", 403);
    }
    const { id } = await ctx.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        match: true,
        items: true,
        tickets: true,
        statusLogs: { orderBy: { createdAt: "desc" }, include: { actor: true } },
        verifiedByAdmin: true,
      },
    });
    if (!order) return errorJson("Not found", 404);
    return safeJson({ order });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = orderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid update", 400);

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true, tickets: true },
    });
    if (!existing) return errorJson("Not found", 404);

    if (parsed.data.verifyPayment) {
      if (!["AWAITING_PAYMENT", "AWAITING_VERIFICATION", "PENDING"].includes(existing.status)) {
        return errorJson("Order cannot be verified in its current state", 400);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id },
          data: {
            status: "PAID",
            paymentStatus: "PAID",
            verifiedAt: new Date(),
            verifiedByAdminId: admin.id,
            reservationExpiresAt: null,
            adminNotes: parsed.data.adminNotes ?? existing.adminNotes,
          },
        });
        await tx.orderStatusLog.create({
          data: {
            orderId: id,
            previousStatus: existing.status,
            newStatus: "PAID",
            previousPaymentStatus: existing.paymentStatus,
            newPaymentStatus: "PAID",
            actorAdminId: admin.id,
            note: "Payment manually verified by admin",
          },
        });
        return order;
      });

      await logAdminActivity(admin.id, "VERIFY_PAYMENT", "order", id);
      const tickets = await issueTicketsForOrder(updated.id);
      const full = await prisma.order.findUnique({
        where: { id },
        include: { match: true, items: true, tickets: true, statusLogs: true },
      });
      return safeJson({ order: full, tickets, verified: true });
    }

    if (parsed.data.cancelOrder) {
      if (["PAID", "TICKET_ISSUED", "REFUNDED"].includes(existing.status)) {
        return errorJson("Cannot cancel a paid/issued order this way — use refund/revoke", 400);
      }
      for (const item of existing.items) {
        if (item.ticketCategoryId) {
          await releaseReservation(item.ticketCategoryId, item.quantity);
        }
      }
      await prisma.seat.updateMany({
        where: { orderId: id, status: "RESERVED" },
        data: { status: "AVAILABLE", orderId: null, reservedUntil: null },
      });
      const order = await prisma.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          reservationExpiresAt: null,
          adminNotes: parsed.data.adminNotes ?? existing.adminNotes,
        },
        include: { items: true, tickets: true, match: true, seats: true },
      });
      await prisma.orderStatusLog.create({
        data: {
          orderId: id,
          previousStatus: existing.status,
          newStatus: "CANCELLED",
          previousPaymentStatus: existing.paymentStatus,
          newPaymentStatus: existing.paymentStatus,
          actorAdminId: admin.id,
          note: "Order cancelled by admin",
        },
      });
      await logAdminActivity(admin.id, "CANCEL_ORDER", "order", id);
      return safeJson({ order });
    }

    if (parsed.data.revokeTickets) {
      await prisma.ticket.updateMany({
        where: { orderId: id },
        data: { status: "REVOKED", revokedAt: new Date(), revokeReason: "Revoked by admin" },
      });
      const order = await prisma.order.update({
        where: { id },
        data: { ticketStatus: "REVOKED" },
        include: { tickets: true, match: true, items: true },
      });
      await logAdminActivity(admin.id, "REVOKE_TICKETS", "order", id);
      return safeJson({ order });
    }

    if (parsed.data.reissueTickets) {
      if (existing.paymentStatus !== "PAID" && existing.status !== "PAID" && existing.status !== "TICKET_ISSUED") {
        return errorJson("Can only reissue tickets for paid orders", 400);
      }
      await prisma.ticket.updateMany({
        where: { orderId: id, status: { in: ["VALID", "USED"] } },
        data: { status: "REVOKED", revokedAt: new Date(), revokeReason: "Reissued" },
      });
      // Clear for reissue by temporarily removing so issueTicketsForOrder can create new ones
      // Actually issueTicketsForOrder skips if tickets.length > 0. Delete revoked and recreate.
      await prisma.ticket.deleteMany({ where: { orderId: id } });
      // Reset sold conversion? Reissue shouldn't double-count sold. Skip inventory change.
      const tickets = [];
      const { generateQrToken, generateTicketNumber } = await import("@/lib/utils");
      const item = existing.items[0];
      const match = await prisma.match.findUnique({ where: { id: existing.matchId } });
      const matchSnapshot = JSON.stringify({
        title: match?.title,
        teamAName: match?.teamAName,
        teamBName: match?.teamBName,
        matchDate: match?.matchDate.toISOString(),
        stadiumName: match?.stadiumName,
        city: match?.city,
      });
      for (let i = 0; i < existing.quantity; i++) {
        tickets.push(
          await prisma.ticket.create({
            data: {
              ticketNumber: generateTicketNumber(),
              orderId: id,
              qrToken: generateQrToken(),
              status: "VALID",
              holderName: existing.customerName,
              categoryName: item?.categoryName || "Ticket",
              zoneName: item?.zoneName || null,
              zoneCode: item?.zoneCode || null,
              matchSnapshot,
            },
          })
        );
      }
      const order = await prisma.order.update({
        where: { id },
        data: { status: "TICKET_ISSUED", ticketStatus: "ISSUED" },
        include: { tickets: true, match: true, items: true },
      });
      await logAdminActivity(admin.id, "REISSUE_TICKETS", "order", id);
      return safeJson({ order, tickets });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.paymentStatus) updateData.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.adminNotes !== undefined) updateData.adminNotes = parsed.data.adminNotes;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { match: true, items: true, tickets: true },
    });

    if (parsed.data.status || parsed.data.paymentStatus) {
      await prisma.orderStatusLog.create({
        data: {
          orderId: id,
          previousStatus: existing.status,
          newStatus: order.status,
          previousPaymentStatus: existing.paymentStatus,
          newPaymentStatus: order.paymentStatus,
          actorAdminId: admin.id,
          note: "Manual status update",
        },
      });
    }

    await logAdminActivity(admin.id, "UPDATE_ORDER", "order", id);
    return safeJson({ order });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    console.error(err);
    return errorJson("Failed to update order", 500);
  }
}
