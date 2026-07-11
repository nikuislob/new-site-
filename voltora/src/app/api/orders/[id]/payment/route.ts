import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ paymentMethodId: z.string().min(1) });

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("paymentMethodId required", 400);

    const user = await getCurrentCustomer();
    const guestEmail = req.headers.get("x-guest-email")?.toLowerCase();

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!order) return errorJson("Order not found", 404);

    const isOwner = user && order.userId === user.id;
    const isGuestMatch = !order.userId && guestEmail && order.customerEmail === guestEmail;
    if (!isOwner && !isGuestMatch) return errorJson("Order not found", 404);

    if (order.paymentStatus !== "PENDING") {
      return errorJson("Payment already processed for this order", 400);
    }

    const method = await prisma.paymentMethod.findUnique({
      where: { id: parsed.data.paymentMethodId },
    });

    if (!method || !method.isActive) return errorJson("Payment method not found", 404);
    if (method.slot < 1 || method.slot > 4) return errorJson("Invalid payment method slot", 400);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethodId: method.id,
        paymentMethodName: method.name,
        paymentStatus: "PENDING",
      },
      include: { paymentMethod: true, items: true },
    });

    return safeJson({
      order: updated,
      paymentUrl: method.paymentUrl,
      buttonText: method.buttonText,
      instructions: method.instructions,
    });
  } catch {
    return errorJson("Failed to initiate payment", 500);
  }
}
