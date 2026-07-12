import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { TICKET_PRICES, type TicketType } from "./utils";

export class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function assignSeats(ticketType: TicketType, quantity: number): string[] {
  const section = ticketType === "premium" ? "114" : "312";
  const block = ticketType === "premium" ? "A" : "B";
  const baseRow = ticketType === "premium" ? 8 : 14;
  const seats: string[] = [];
  for (let i = 0; i < quantity; i++) {
    seats.push(`SEC ${section} · BLK ${block} · ROW ${baseRow} · SEAT ${20 + i}`);
  }
  return seats;
}

export async function createCheckoutOrder(input: {
  matchId: string;
  customerEmail: string;
  customerName?: string;
  ticketType: TicketType;
  quantity: number;
}) {
  // CRITICAL: hard backend max of 2 tickets
  if (input.quantity > 2) {
    throw new CheckoutError(
      "Maximum of 2 tickets allowed per online transaction",
      400
    );
  }
  if (input.quantity < 1) {
    throw new CheckoutError("Quantity must be at least 1", 400);
  }

  const match = await prisma.match.findUnique({ where: { id: input.matchId } });
  if (!match) throw new CheckoutError("Match not found", 404);
  if (match.matchDate.getTime() <= Date.now()) {
    throw new CheckoutError("This match is no longer available for purchase", 400);
  }

  const available =
    input.ticketType === "standard" ? match.standardAvailable : match.premiumAvailable;
  if (available < input.quantity) {
    throw new CheckoutError("Not enough tickets remaining for this tier", 409);
  }

  const unit = TICKET_PRICES[input.ticketType];
  const total = unit * input.quantity;
  const linkWorkflow = input.quantity === 1 ? "1_ticket" : "2_ticket";
  const assignedSeats = assignSeats(input.ticketType, input.quantity);

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.match.update({
      where: { id: match.id },
      data:
        input.ticketType === "standard"
          ? { standardAvailable: { decrement: input.quantity } }
          : { premiumAvailable: { decrement: input.quantity } },
    });

    const remaining =
      input.ticketType === "standard" ? updated.standardAvailable : updated.premiumAvailable;
    if (remaining < 0) {
      throw new CheckoutError("Not enough tickets remaining for this tier", 409);
    }

    return tx.order.create({
      data: {
        matchId: match.id,
        customerEmail: input.customerEmail.toLowerCase(),
        customerName: input.customerName || null,
        ticketType: input.ticketType,
        quantity: input.quantity,
        totalPrice: new Prisma.Decimal(total.toFixed(2)),
        paymentStatus: "pending_link",
        paymentLinkSent: null,
        assignedSeats,
        linkWorkflow,
      },
      include: { match: true },
    });
  });

  return order;
}
