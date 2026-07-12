import { prisma } from "./db";
import {
  availableInventory,
  getMaxTicketsPerOrder,
  getReservationMinutes,
  InventoryError,
  releaseExpiredReservations,
} from "./inventory";
import {
  generateAccessCode,
  generateOrderNumber,
  isValidHttpsUrl,
} from "./utils";

export async function resolvePaymentLink(
  ticketCategoryId: string,
  quantity: number,
  paymentMethodCode: string
): Promise<
  | { error: string }
  | {
      method: { id: string; code: string; name: string; buttonText: string; instructions: string | null };
      mapping: { paymentUrl: string; expectedAmountCents: number };
    }
> {
  const method = await prisma.paymentMethod.findUnique({
    where: { code: paymentMethodCode },
  });
  if (!method || !method.isActive) {
    return { error: "Payment method unavailable" };
  }

  const mapping = await prisma.paymentLinkMapping.findUnique({
    where: {
      ticketCategoryId_quantity_paymentMethodId: {
        ticketCategoryId,
        quantity,
        paymentMethodId: method.id,
      },
    },
  });

  if (!mapping || !mapping.isActive) {
    return { error: "Payment link unavailable for this selection" };
  }

  if (!isValidHttpsUrl(mapping.paymentUrl)) {
    return { error: "Configured payment link is invalid" };
  }

  return { method, mapping };
}

export async function createPendingOrder(input: {
  matchId: string;
  seatIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  paymentMethodCode: "APPLE_PAY" | "CASH_APP";
  userId?: string | null;
}) {
  await releaseExpiredReservations();

  const maxQty = await getMaxTicketsPerOrder();
  const quantity = input.seatIds.length;
  if (quantity < 1 || quantity > maxQty) {
    throw new InventoryError(`Maximum ${maxQty} tickets per order`);
  }

  const uniqueSeatIds = [...new Set(input.seatIds)];
  if (uniqueSeatIds.length !== input.seatIds.length) {
    throw new InventoryError("Duplicate seats selected");
  }

  const match = await prisma.match.findUnique({ where: { id: input.matchId } });
  if (!match || !match.isActive || !match.salesEnabled || match.isSoldOut) {
    throw new InventoryError("Ticket sales are not available for this match");
  }

  const seats = await prisma.seat.findMany({
    where: {
      id: { in: uniqueSeatIds },
      matchId: input.matchId,
    },
    include: { zone: true, category: true },
  });

  if (seats.length !== uniqueSeatIds.length) {
    throw new InventoryError("One or more selected seats were not found");
  }

  for (const seat of seats) {
    if (seat.status !== "AVAILABLE") {
      throw new InventoryError(`Seat ${seat.section}-${seat.row}-${seat.seatNumber} is no longer available`);
    }
  }

  const categoryIds = [...new Set(seats.map((s) => s.categoryId))];
  if (categoryIds.length !== 1) {
    throw new InventoryError("All selected seats must be from the same ticket category");
  }

  const category = seats[0].category;
  if (!category.isActive) throw new InventoryError("Ticket category unavailable");

  const available = availableInventory(
    category.totalInventory,
    category.reservedCount,
    category.soldCount
  );
  if (available < quantity) {
    throw new InventoryError("Not enough tickets available");
  }

  const payment = await resolvePaymentLink(category.id, quantity, input.paymentMethodCode);
  if ("error" in payment) {
    throw new InventoryError(payment.error || "Payment link unavailable");
  }

  const { method, mapping } = payment;
  const unitPriceCents = category.priceCents;
  const subtotalCents = unitPriceCents * quantity;
  const reservationMinutes = await getReservationMinutes();
  const reservationExpiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    // Re-check seats inside transaction
    const lockedSeats = await tx.seat.findMany({
      where: { id: { in: uniqueSeatIds } },
      include: { zone: true, category: true },
    });
    if (lockedSeats.some((s) => s.status !== "AVAILABLE")) {
      throw new InventoryError("Selected seats were just taken — please choose again");
    }

    const lockedCat = await tx.ticketCategory.findUnique({ where: { id: category.id } });
    if (!lockedCat) throw new InventoryError("Ticket category unavailable");
    const avail = availableInventory(lockedCat.totalInventory, lockedCat.reservedCount, lockedCat.soldCount);
    if (avail < quantity) throw new InventoryError("Not enough tickets available");

    await tx.ticketCategory.update({
      where: { id: category.id },
      data: { reservedCount: lockedCat.reservedCount + quantity },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        accessCode: generateAccessCode(),
        matchId: match.id,
        userId: input.userId || null,
        status: "AWAITING_PAYMENT",
        paymentStatus: "PENDING",
        ticketStatus: "NONE",
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail.trim().toLowerCase(),
        customerPhone: input.customerPhone?.trim() || null,
        paymentMethodId: method.id,
        paymentMethodCode: method.code,
        paymentMethodName: method.name,
        paymentUrlUsed: mapping.paymentUrl,
        unitPriceCents,
        quantity,
        subtotalCents,
        feesCents: 0,
        totalCents: subtotalCents,
        reservationExpiresAt,
        items: {
          create: seats.map((seat) => ({
            ticketCategoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            zoneCode: seat.zone.code,
            zoneName: seat.zone.name,
            section: seat.section,
            block: seat.block,
            row: seat.row,
            seatNumber: seat.seatNumber,
            seatId: seat.id,
            unitPriceCents,
            quantity: 1,
            lineTotalCents: unitPriceCents,
          })),
        },
        statusLogs: {
          create: {
            previousStatus: null,
            newStatus: "AWAITING_PAYMENT",
            previousPaymentStatus: null,
            newPaymentStatus: "PENDING",
            note: "Order created — seats reserved",
          },
        },
      },
      include: {
        match: true,
        items: true,
        paymentMethod: true,
        seats: true,
      },
    });

    await tx.seat.updateMany({
      where: { id: { in: uniqueSeatIds } },
      data: {
        status: "RESERVED",
        orderId: created.id,
        reservedUntil: reservationExpiresAt,
      },
    });

    return tx.order.findUniqueOrThrow({
      where: { id: created.id },
      include: { match: true, items: true, paymentMethod: true, seats: true },
    });
  });

  return {
    order,
    paymentUrl: mapping.paymentUrl,
    buttonText: method.buttonText,
    instructions: method.instructions,
    expectedAmountCents: mapping.expectedAmountCents,
  };
}

export async function markOrderAwaitingVerification(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (!["AWAITING_PAYMENT", "PENDING"].includes(order.status)) return order;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "AWAITING_VERIFICATION",
        paymentStatus: "AWAITING_VERIFICATION",
      },
    });
    await tx.orderStatusLog.create({
      data: {
        orderId,
        previousStatus: order.status,
        newStatus: "AWAITING_VERIFICATION",
        previousPaymentStatus: order.paymentStatus,
        newPaymentStatus: "AWAITING_VERIFICATION",
        note: "Customer indicated payment submitted — awaiting admin verification",
      },
    });
    return updated;
  });
}
