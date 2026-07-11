import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getCurrentCustomer();
    const guestEmail = req.nextUrl.searchParams.get("email")?.toLowerCase();

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: { items: true, paymentMethod: true },
    });

    if (!order) return errorJson("Order not found", 404);

    const isOwner = user && order.userId === user.id;
    const isGuestMatch = !order.userId && guestEmail && order.customerEmail === guestEmail;

    if (!isOwner && !isGuestMatch) {
      return errorJson("Order not found", 404);
    }

    return safeJson({ order });
  } catch {
    return errorJson("Failed to fetch order", 500);
  }
}
