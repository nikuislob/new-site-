import { NextRequest } from "next/server";
import { createPendingOrder } from "@/lib/orders";
import { InventoryError } from "@/lib/inventory";
import { getCurrentCustomer } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { errorJson, formatCurrency, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Invalid checkout data", 400);
    }

    const user = await getCurrentCustomer();
    const result = await createPendingOrder({
      ...parsed.data,
      userId: user?.id || null,
    });
    const { order, paymentUrl, buttonText, instructions, expectedAmountCents } = result;

    return safeJson(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          accessCode: order.accessCode,
          status: order.status,
          paymentStatus: order.paymentStatus,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          quantity: order.quantity,
          unitPriceCents: order.unitPriceCents,
          subtotalCents: order.subtotalCents,
          feesCents: order.feesCents,
          totalCents: order.totalCents,
          totalFormatted: formatCurrency(order.totalCents),
          paymentMethodCode: order.paymentMethodCode,
          paymentMethodName: order.paymentMethodName,
          reservationExpiresAt: order.reservationExpiresAt?.toISOString() || null,
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
        },
        paymentUrl,
        buttonText,
        instructions,
        expectedAmountCents,
        expectedAmountFormatted: formatCurrency(expectedAmountCents),
      },
      201
    );
  } catch (err) {
    if (err instanceof InventoryError) {
      return errorJson(err.message, 409);
    }
    console.error(err);
    return errorJson("Unable to create order", 500);
  }
}
