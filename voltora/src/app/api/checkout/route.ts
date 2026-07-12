import { NextRequest } from "next/server";
import { CheckoutError, createCheckoutOrder } from "@/lib/orders";
import { checkoutSchema } from "@/lib/validators";
import { errorJson, formatCurrency, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Invalid checkout data", 400);
    }

    // Extra explicit security guard (also enforced inside createCheckoutOrder)
    if (parsed.data.quantity > 2) {
      return errorJson("Maximum of 2 tickets allowed per online transaction", 400);
    }

    const order = await createCheckoutOrder(parsed.data);

    return safeJson(
      {
        order: {
          id: order.id,
          matchId: order.matchId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          ticketType: order.ticketType,
          quantity: order.quantity,
          totalPrice: Number(order.totalPrice),
          totalFormatted: formatCurrency(Number(order.totalPrice)),
          paymentStatus: order.paymentStatus,
          paymentLinkSent: order.paymentLinkSent,
          assignedSeats: order.assignedSeats,
          linkWorkflow: order.linkWorkflow,
          match: {
            homeTeam: order.match.homeTeam,
            awayTeam: order.match.awayTeam,
            venue: order.match.venue,
            matchDate: order.match.matchDate.toISOString(),
          },
        },
        message:
          order.linkWorkflow === "1_ticket"
            ? "Order created for 1-ticket payment link workflow"
            : "Order created for combined 2-ticket payment link workflow",
      },
      201
    );
  } catch (err) {
    if (err instanceof CheckoutError) {
      return errorJson(err.message, err.status);
    }
    console.error(err);
    return errorJson("Unable to create order", 500);
  }
}
