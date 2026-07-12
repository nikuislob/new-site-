import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { findTicketSchema } from "@/lib/validators";
import { generateQrDataUrl } from "@/lib/tickets";
import { errorJson, formatCurrency, safeJson } from "@/lib/utils";
import { releaseExpiredReservations } from "@/lib/inventory";

export async function POST(req: NextRequest) {
  await releaseExpiredReservations();
  const body = await req.json();
  const parsed = findTicketSchema.safeParse(body);
  if (!parsed.success) return errorJson("Provide a valid order ID and access code", 400);

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber.trim().toUpperCase() },
    include: { match: true, items: true, tickets: true },
  });

  if (!order) return errorJson("Booking not found", 404);

  if (order.accessCode.toUpperCase() !== parsed.data.accessCode.trim().toUpperCase()) {
    return errorJson("Invalid access code", 401);
  }

  if (
    parsed.data.email &&
    parsed.data.email.toLowerCase() !== order.customerEmail.toLowerCase()
  ) {
    return errorJson("Email does not match this booking", 401);
  }

  const tickets = [];
  for (const ticket of order.tickets) {
    tickets.push({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      categoryName: ticket.categoryName,
      zoneName: ticket.zoneName,
      holderName: ticket.holderName,
      qrDataUrl: await generateQrDataUrl(ticket.qrToken),
      matchSnapshot: JSON.parse(ticket.matchSnapshot),
    });
  }

  return safeJson({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      ticketStatus: order.ticketStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      quantity: order.quantity,
      totalCents: order.totalCents,
      totalFormatted: formatCurrency(order.totalCents),
      match: {
        title: order.match.title,
        teamAName: order.match.teamAName,
        teamBName: order.match.teamBName,
        matchDate: order.match.matchDate.toISOString(),
        stadiumName: order.match.stadiumName,
        city: order.match.city,
      },
      items: order.items,
      tickets,
    },
  });
}
