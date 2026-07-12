import { AuthError, requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, formatCurrency, safeJson } from "@/lib/utils";
import { generateQrDataUrl } from "@/lib/tickets";

export async function GET() {
  try {
    const user = await requireCustomer();
    const orders = await prisma.order.findMany({
      where: {
        OR: [{ userId: user.id }, { customerEmail: user.email }],
      },
      include: {
        match: true,
        items: true,
        tickets: true,
        seats: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = [];
    for (const order of orders) {
      const tickets = [];
      for (const ticket of order.tickets) {
        tickets.push({
          ...ticket,
          qrDataUrl: await generateQrDataUrl(ticket.qrToken),
        });
      }
      enriched.push({
        id: order.id,
        orderNumber: order.orderNumber,
        accessCode: order.accessCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        ticketStatus: order.ticketStatus,
        quantity: order.quantity,
        totalCents: order.totalCents,
        totalFormatted: formatCurrency(order.totalCents),
        createdAt: order.createdAt,
        match: {
          title: order.match.title,
          teamAName: order.match.teamAName,
          teamBName: order.match.teamBName,
          matchDate: order.match.matchDate.toISOString(),
          stadiumName: order.match.stadiumName,
          city: order.match.city,
        },
        items: order.items,
        seats: order.seats,
        tickets,
      });
    }

    return safeJson({ orders: enriched });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Unable to load orders", 500);
  }
}
