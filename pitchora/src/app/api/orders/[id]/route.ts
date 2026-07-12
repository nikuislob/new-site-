import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
        seats: true,
      },
    });
    if (!order) return errorJson("Order not found", 404);

    return safeJson({
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        match: {
          ...order.match,
          kickoffAt: order.match.kickoffAt.toISOString(),
          createdAt: order.match.createdAt.toISOString(),
          updatedAt: order.match.updatedAt.toISOString(),
          homeTeam: {
            ...order.match.homeTeam,
            createdAt: order.match.homeTeam.createdAt.toISOString(),
            updatedAt: order.match.homeTeam.updatedAt.toISOString(),
          },
          awayTeam: {
            ...order.match.awayTeam,
            createdAt: order.match.awayTeam.createdAt.toISOString(),
            updatedAt: order.match.awayTeam.updatedAt.toISOString(),
          },
        },
      },
    });
  } catch (e) {
    console.error(e);
    return errorJson("Failed to load order", 500);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });
    if (!order) return errorJson("Order not found", 404);

    if (action === "confirm-payment") {
      const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID" },
        });
        await tx.seat.updateMany({
          where: { orderId: order.id },
          data: { status: "SOLD" },
        });
        return o;
      });
      return safeJson({ order: { id: updated.id, paymentStatus: updated.paymentStatus } });
    }

    return errorJson("Unknown action", 400);
  } catch (e) {
    console.error(e);
    return errorJson("Failed to update order", 500);
  }
}
