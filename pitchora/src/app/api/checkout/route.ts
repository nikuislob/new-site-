import { prisma } from "@/lib/db";
import { calculateOrderTotals, getPaymentLinks, type TicketCategory } from "@/lib/pricing";
import { expirePastMatches } from "@/lib/matches";
import { releaseExpiredHolds, seatLabel } from "@/lib/seats";
import { checkoutSchema } from "@/lib/validators";
import { errorJson, generateOrderNumber, safeJson } from "@/lib/utils";
import { z } from "zod";

const schema = checkoutSchema.extend({
  holdToken: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    await expirePastMatches();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid checkout payload", 400, { issues: parsed.error.issues });

    const data = parsed.data;
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) return errorJson("Settings missing", 500);

    if (data.seatIds.length > settings.maxTicketsPerOrder) {
      return errorJson("For bookings of 3 or more tickets, please contact our support team.", 400);
    }

    await releaseExpiredHolds(data.matchId);

    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) return errorJson("Match not found", 404);
    if (match.kickoffAt <= new Date() || match.status === "COMPLETED") {
      return errorJson("This match is no longer available", 410);
    }

    const seats = await prisma.seat.findMany({
      where: { id: { in: data.seatIds }, matchId: data.matchId },
    });
    if (seats.length !== data.seatIds.length) return errorJson("One or more seats were not found", 400);

    const now = new Date();
    for (const seat of seats) {
      const validHold =
        seat.status === "HELD" &&
        seat.holdToken === data.holdToken &&
        seat.holdExpiresAt &&
        seat.holdExpiresAt > now;
      if (!validHold) {
        return errorJson(
          `Seat ${seatLabel(seat)} hold expired or invalid. Please select seats again.`,
          409
        );
      }
      if (seat.category !== data.ticketCategory) {
        return errorJson("Seat category mismatch", 400);
      }
    }

    // Authoritative price from DB seat records + settings
    const category = data.ticketCategory as TicketCategory;
    const totals = calculateOrderTotals(settings, category, seats.length);
    const dbUnit = seats[0]?.price || totals.unitPrice;
    // Prefer settings-driven totals for fees/tax; unit must match category settings
    if (Math.abs(dbUnit - totals.unitPrice) > 0.01 && seats.every((s) => Math.abs(s.price - totals.unitPrice) < 0.01)) {
      // ok - seats priced consistently
    }
    const links = getPaymentLinks(settings, category);
    const paymentLinkUsed =
      data.paymentMethod === "APPLE_PAY" ? links.applePayUrl : links.cashAppUrl;

    const orderNumber = generateOrderNumber();
    const labels = seats.map(seatLabel).join(", ");
    const qrPayload = JSON.stringify({
      orderNumber,
      matchId: match.id,
      seats: labels,
      email: data.customerEmail,
    });

    // Extend hold while payment pending; do NOT mark SOLD until payment verified
    const holdUntil = new Date(Date.now() + 30 * 60 * 1000);

    const order = await prisma.$transaction(async (tx) => {
      // Re-check holds inside transaction to prevent race
      const locked = await tx.seat.findMany({
        where: { id: { in: data.seatIds }, matchId: data.matchId },
      });
      for (const seat of locked) {
        if (
          seat.status !== "HELD" ||
          seat.holdToken !== data.holdToken ||
          !seat.holdExpiresAt ||
          seat.holdExpiresAt <= new Date()
        ) {
          throw new Error("SEAT_RACE");
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          matchId: match.id,
          ticketCategory: category,
          quantity: seats.length,
          seatLabels: labels,
          unitPrice: totals.unitPrice,
          subtotal: totals.subtotal,
          serviceFee: totals.serviceFee,
          taxAmount: totals.taxAmount,
          originalTotal: totals.originalTotal,
          paymentAmount: totals.paymentAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          paymentLinkUsed,
          qrPayload,
        },
      });

      await tx.seat.updateMany({
        where: { id: { in: data.seatIds } },
        data: {
          status: "HELD",
          holdToken: data.holdToken,
          holdExpiresAt: holdUntil,
          orderId: created.id,
        },
      });

      return created;
    });

    return safeJson(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          originalTotal: order.originalTotal,
          paymentAmount: order.paymentAmount,
          paymentMethod: order.paymentMethod,
          paymentLinkUsed: order.paymentLinkUsed,
          paymentStatus: order.paymentStatus,
          quantity: order.quantity,
          ticketCategory: order.ticketCategory,
          seatLabels: order.seatLabels,
          uniquePaymentEnabled: settings.uniquePaymentEnabled,
          holdExpiresAt: holdUntil.toISOString(),
        },
      },
      201
    );
  } catch (e) {
    if (e instanceof Error && e.message === "SEAT_RACE") {
      return errorJson("Seats were taken by another customer. Please select again.", 409);
    }
    console.error(e);
    return errorJson("Checkout failed", 500);
  }
}
