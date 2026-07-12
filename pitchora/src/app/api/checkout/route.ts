import { prisma } from "@/lib/db";
import { calculateOrderTotals, getPaymentLinks, type TicketCategory } from "@/lib/pricing";
import { expirePastMatches } from "@/lib/matches";
import { seatLabel } from "@/lib/seats";
import { checkoutSchema } from "@/lib/validators";
import { errorJson, generateOrderNumber, safeJson } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    await expirePastMatches();
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid checkout payload", 400, { issues: parsed.error.issues });

    const data = parsed.data;
    if (data.seatIds.length > 2) {
      return errorJson("Maximum 2 tickets per order. Please contact support for bulk bookings.", 400);
    }

    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) return errorJson("Settings missing", 500);

    if (data.seatIds.length > settings.maxTicketsPerOrder) {
      return errorJson(
        "For bookings of 3 or more tickets, please contact our support team.",
        400
      );
    }

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
    if (seats.some((s) => s.status !== "AVAILABLE")) {
      return errorJson("One or more selected seats are no longer available", 409);
    }
    if (seats.some((s) => s.category !== data.ticketCategory)) {
      return errorJson("Seat category mismatch", 400);
    }

    const category = data.ticketCategory as TicketCategory;
    const totals = calculateOrderTotals(settings, category, seats.length);
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

    const order = await prisma.$transaction(async (tx) => {
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
        data: { status: "RESERVED", orderId: created.id },
      });

      if (category === "UPPER") {
        await tx.match.update({
          where: { id: match.id },
          data: { upperSeatsSold: { increment: seats.length } },
        });
      } else {
        await tx.match.update({
          where: { id: match.id },
          data: { closerSeatsSold: { increment: seats.length } },
        });
      }

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
        },
      },
      201
    );
  } catch (e) {
    console.error(e);
    return errorJson("Checkout failed", 500);
  }
}
