import QRCode from "qrcode";
import { prisma } from "./db";
import { absoluteUrl, generateQrToken, generateTicketNumber } from "./utils";
import { getSetting } from "./settings";
import { convertReservationToSold } from "./inventory";

export async function issueTicketsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      match: true,
      items: true,
      tickets: true,
      seats: true,
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.paymentStatus !== "PAID" && order.status !== "PAID" && order.status !== "TICKET_ISSUED") {
    throw new Error("Tickets can only be issued for paid orders");
  }
  if (order.tickets.length > 0) {
    return order.tickets;
  }

  const entryInstructions = await getSetting("entry_instructions");
  const matchSnapshot = JSON.stringify({
    title: order.match.title,
    teamAName: order.match.teamAName,
    teamBName: order.match.teamBName,
    matchDate: order.match.matchDate.toISOString(),
    stadiumName: order.match.stadiumName,
    city: order.match.city,
    entryInstructions,
  });

  const tickets = [];
  const items = order.items.length > 0 ? order.items : [];

  for (let i = 0; i < Math.max(order.quantity, items.length); i++) {
    const item = items[i] || items[0];
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        orderId: order.id,
        qrToken: generateQrToken(),
        status: "VALID",
        holderName: order.customerName,
        categoryName: item?.categoryName || "Ticket",
        zoneName: item?.zoneName || null,
        zoneCode: item?.zoneCode || null,
        section: item?.section || null,
        block: item?.block || null,
        row: item?.row || null,
        seatNumber: item?.seatNumber || null,
        matchSnapshot,
      },
    });
    tickets.push(ticket);
  }

  // Mark seats sold
  await prisma.seat.updateMany({
    where: { orderId: order.id },
    data: { status: "SOLD", reservedUntil: null },
  });

  const categoryId = items[0]?.ticketCategoryId;
  if (categoryId) {
    await convertReservationToSold(categoryId, order.quantity);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "TICKET_ISSUED",
      ticketStatus: "ISSUED",
      reservationExpiresAt: null,
    },
  });

  await prisma.orderStatusLog.create({
    data: {
      orderId: order.id,
      previousStatus: order.status,
      newStatus: "TICKET_ISSUED",
      previousPaymentStatus: order.paymentStatus,
      newPaymentStatus: order.paymentStatus,
      note: "Tickets generated after payment verification",
    },
  });

  return tickets;
}

export function qrPayload(token: string): string {
  return absoluteUrl(`/api/tickets/qr/${token}`);
}

export async function generateQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(qrPayload(token), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: { dark: "#0a1628", light: "#ffffff" },
  });
}

export async function validateQrToken(token: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: token },
    include: {
      order: {
        include: { match: true },
      },
    },
  });
  if (!ticket) return { valid: false as const, reason: "Ticket not found" };
  if (ticket.status !== "VALID") {
    return { valid: false as const, reason: `Ticket is ${ticket.status}`, ticket };
  }
  return { valid: true as const, ticket };
}

export async function checkInTicket(token: string, staffName: string) {
  const result = await validateQrToken(token);
  if (!result.valid || !result.ticket) {
    return result;
  }
  if (result.ticket.checkedInAt) {
    return { valid: false as const, reason: "Already checked in", ticket: result.ticket };
  }
  const updated = await prisma.ticket.update({
    where: { id: result.ticket.id },
    data: {
      status: "USED",
      checkedInAt: new Date(),
      checkedInBy: staffName,
    },
    include: { order: { include: { match: true } } },
  });
  return { valid: true as const, ticket: updated };
}
