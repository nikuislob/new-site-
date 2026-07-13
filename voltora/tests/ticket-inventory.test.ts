import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/db";
import { releaseExpiredReservations, reserveInventory } from "../src/lib/tickets";

const originalInventory = new Map<string, { available: number; reserved: number }>();

afterAll(async () => {
  for (const [listingId, original] of originalInventory) {
    await prisma.ticketListing.update({
      where: { id: listingId },
      data: { quantityAvailable: original.available, quantityReserved: original.reserved },
    });
    await prisma.inventoryReservation.deleteMany({ where: { listingId, bookingId: null } });
  }
  await prisma.$disconnect();
});

describe("database-backed inventory reservations", () => {
  it("allows only one concurrent hold for the last available ticket", async () => {
    const listing = await prisma.ticketListing.findFirst({ where: { isActive: true } });
    if (!listing) throw new Error("Seeded listing required");
    originalInventory.set(listing.id, { available: listing.quantityAvailable, reserved: listing.quantityReserved });
    await prisma.ticketListing.update({
      where: { id: listing.id },
      data: { quantityAvailable: 1, quantityReserved: 0 },
    });

    const attempts = await Promise.allSettled([
      reserveInventory(listing.id, 1),
      reserveInventory(listing.id, 1),
    ]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const current = await prisma.ticketListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(current.quantityAvailable).toBe(0);
    expect(current.quantityReserved).toBe(1);
  });

  it("releases an expired hold back to available inventory exactly once", async () => {
    const listing = await prisma.ticketListing.findFirst({ where: { isActive: true, quantityAvailable: { gte: 2 } } });
    if (!listing) throw new Error("Seeded listing required");
    originalInventory.set(listing.id, { available: listing.quantityAvailable, reserved: listing.quantityReserved });
    const before = listing.quantityAvailable;
    await prisma.$transaction([
      prisma.ticketListing.update({
        where: { id: listing.id },
        data: { quantityAvailable: { decrement: 2 }, quantityReserved: { increment: 2 } },
      }),
      prisma.inventoryReservation.create({
        data: { token: `expired-${Date.now()}`, listingId: listing.id, quantity: 2, expiresAt: new Date(Date.now() - 1000) },
      }),
    ]);
    expect(await releaseExpiredReservations()).toBeGreaterThanOrEqual(1);
    expect(await releaseExpiredReservations()).toBe(0);
    const current = await prisma.ticketListing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(current.quantityAvailable).toBe(before);
  });
});
