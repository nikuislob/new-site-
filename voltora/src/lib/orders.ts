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
  ticketCategoryId: string;
  zoneCode?: string | null;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  paymentMethodCode: "APPLE_PAY" | "CASH_APP";
}) {
  await releaseExpiredReservations();

  const maxQty = await getMaxTicketsPerOrder();
  if (input.quantity < 1 || input.quantity > maxQty) {
    throw new InventoryError(`Maximum ${maxQty} tickets per order`);
  }

  const match = await prisma.match.findUnique({ where: { id: input.matchId } });
  if (!match || !match.isActive || !match.salesEnabled || match.isSoldOut) {
    throw new InventoryError("Ticket sales are not available for this match");
  }

  const category = await prisma.ticketCategory.findFirst({
    where: { id: input.ticketCategoryId, matchId: input.matchId, isActive: true },
  });
  if (!category) throw new InventoryError("Ticket category unavailable");

  const available = availableInventory(
    category.totalInventory,
    category.reservedCount,
    category.soldCount
  );
  if (available < input.quantity) {
    throw new InventoryError("Not enough tickets available");
  }

  let zoneName: string | null = null;
  let zoneCode: string | null = input.zoneCode || null;
  if (input.zoneCode) {
    const zone = await prisma.stadiumZone.findFirst({
      where: {
        matchId: input.matchId,
        code: input.zoneCode,
        categoryId: category.id,
        isActive: true,
      },
    });
    if (!zone) throw new InventoryError("Selected stadium section unavailable");
    zoneName = zone.name;
    zoneCode = zone.code;
  } else {
    const fallbackZone = await prisma.stadiumZone.findFirst({
      where: { matchId: input.matchId, categoryId: category.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    zoneName = fallbackZone?.name || null;
    zoneCode = fallbackZone?.code || null;
  }

  const payment = await resolvePaymentLink(
    category.id,
    input.quantity,
    input.paymentMethodCode
  );
  if ("error" in payment) {
    throw new InventoryError(payment.error || "Payment link unavailable");
  }

  const { method, mapping } = payment;

  const unitPriceCents = category.priceCents;
  const subtotalCents = unitPriceCents * input.quantity;
  const expected = mapping.expectedAmountCents;
  if (expected !== subtotalCents) {
    // Prefer category price as source of truth; still redirect to mapped link
  }

  const reservationMinutes = await getReservationMinutes();
  const reservationExpiresAt = new Date(Date.now() + reservationMinutes * 60 * 1000);

  const order = await prisma.$transaction(async (tx) => {
    const locked = await tx.ticketCategory.findUnique({ where: { id: category.id } });
    if (!locked) throw new InventoryError("Ticket category unavailable");
    const avail = availableInventory(locked.totalInventory, locked.reservedCount, locked.soldCount);
    if (avail < input.quantity) throw new InventoryError("Not enough tickets available");

    await tx.ticketCategory.update({
      where: { id: category.id },
      data: { reservedCount: locked.reservedCount + input.quantity },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        accessCode: generateAccessCode(),
        matchId: match.id,
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
        quantity: input.quantity,
        subtotalCents,
        feesCents: 0,
        totalCents: subtotalCents,
        reservationExpiresAt,
        items: {
          create: {
            ticketCategoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            zoneCode,
            zoneName,
            unitPriceCents,
            quantity: input.quantity,
            lineTotalCents: subtotalCents,
          },
        },
        statusLogs: {
          create: {
            previousStatus: null,
            newStatus: "AWAITING_PAYMENT",
            previousPaymentStatus: null,
            newPaymentStatus: "PENDING",
            note: "Order created and inventory reserved",
          },
        },
      },
      include: {
        match: true,
        items: true,
        paymentMethod: true,
      },
    });

    return created;
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
