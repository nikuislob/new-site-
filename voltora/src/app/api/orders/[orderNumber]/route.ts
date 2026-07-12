import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/inventory";
import { markOrderAwaitingVerification } from "@/lib/orders";
import { generateQrDataUrl } from "@/lib/tickets";
import { errorJson, formatCurrency, safeJson } from "@/lib/utils";

async function loadOrder(orderNumber: string) {
  await releaseExpiredReservations();
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      match: true,
      items: true,
      tickets: true,
    },
  });
}

function authorize(order: { accessCode: string; customerEmail: string }, req: NextRequest, body?: { accessCode?: string; email?: string }) {
  const accessCode =
    body?.accessCode ||
    req.headers.get("x-access-code") ||
    req.nextUrl.searchParams.get("accessCode") ||
    "";
  const email =
    body?.email ||
    req.headers.get("x-guest-email") ||
    req.nextUrl.searchParams.get("email") ||
    "";

  if (accessCode && accessCode.toUpperCase() === order.accessCode.toUpperCase()) return true;
  if (email && email.toLowerCase() === order.customerEmail.toLowerCase() && accessCode) {
    return accessCode.toUpperCase() === order.accessCode.toUpperCase();
  }
  return false;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await ctx.params;
  const order = await loadOrder(orderNumber);
  if (!order) return errorJson("Order not found", 404);
  if (!authorize(order, req)) return errorJson("Unauthorized", 401);

  const tickets = [];
  for (const ticket of order.tickets) {
    tickets.push({
      ...ticket,
      qrDataUrl: await generateQrDataUrl(ticket.qrToken),
    });
  }

  return safeJson({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      ticketStatus: order.ticketStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      quantity: order.quantity,
      unitPriceCents: order.unitPriceCents,
      subtotalCents: order.subtotalCents,
      feesCents: order.feesCents,
      totalCents: order.totalCents,
      totalFormatted: formatCurrency(order.totalCents),
      paymentMethodName: order.paymentMethodName,
      paymentMethodCode: order.paymentMethodCode,
      paymentUrlUsed: order.paymentUrlUsed,
      reservationExpiresAt: order.reservationExpiresAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await ctx.params;
  const order = await loadOrder(orderNumber);
  if (!order) return errorJson("Order not found", 404);

  const body = await req.json().catch(() => ({}));
  if (!authorize(order, req, body)) return errorJson("Unauthorized", 401);

  if (body.action === "submitted_payment") {
    if (order.reservationExpiresAt && order.reservationExpiresAt < new Date()) {
      return errorJson("Your reservation has expired. Please start a new order.", 410);
    }
    const updated = await markOrderAwaitingVerification(order.id);
    return safeJson({
      order: {
        orderNumber: updated?.orderNumber,
        status: updated?.status,
        paymentStatus: updated?.paymentStatus,
      },
      message: "Payment submitted. We will verify and issue your tickets shortly.",
    });
  }

  return errorJson("Unknown action", 400);
}
