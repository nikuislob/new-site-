import { prisma } from "./db";
import { getSetting } from "./settings";

export function availableInventory(total: number, reserved: number, sold: number): number {
  return Math.max(0, total - reserved - sold);
}

export async function getMaxTicketsPerOrder(): Promise<number> {
  const raw = await getSetting("max_tickets_per_order");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10) : 2;
}

export async function getReservationMinutes(): Promise<number> {
  const raw = await getSetting("reservation_minutes");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 15;
}

export async function releaseExpiredReservations() {
  const now = new Date();
  const expired = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "AWAITING_PAYMENT"] },
      reservationExpiresAt: { lt: now },
    },
    include: { items: true },
  });

  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.ticketCategoryId) continue;
        const category = await tx.ticketCategory.findUnique({
          where: { id: item.ticketCategoryId },
        });
        if (!category) continue;
        await tx.ticketCategory.update({
          where: { id: category.id },
          data: {
            reservedCount: Math.max(0, category.reservedCount - item.quantity),
          },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", reservationExpiresAt: null },
      });
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          previousStatus: order.status,
          newStatus: "CANCELLED",
          previousPaymentStatus: order.paymentStatus,
          newPaymentStatus: order.paymentStatus,
          note: "Reservation expired — inventory released",
        },
      });
    });
  }

  return expired.length;
}

export async function reserveInventory(categoryId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.ticketCategory.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      throw new InventoryError("Ticket category unavailable");
    }
    const available = availableInventory(
      category.totalInventory,
      category.reservedCount,
      category.soldCount
    );
    if (available < quantity) {
      throw new InventoryError("Not enough tickets available");
    }
    return tx.ticketCategory.update({
      where: { id: categoryId },
      data: { reservedCount: category.reservedCount + quantity },
    });
  });
}

export async function convertReservationToSold(categoryId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.ticketCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new InventoryError("Category not found");
    return tx.ticketCategory.update({
      where: { id: categoryId },
      data: {
        reservedCount: Math.max(0, category.reservedCount - quantity),
        soldCount: category.soldCount + quantity,
      },
    });
  });
}

export async function releaseReservation(categoryId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const category = await tx.ticketCategory.findUnique({ where: { id: categoryId } });
    if (!category) return null;
    return tx.ticketCategory.update({
      where: { id: categoryId },
      data: {
        reservedCount: Math.max(0, category.reservedCount - quantity),
      },
    });
  });
}

export class InventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryError";
  }
}
