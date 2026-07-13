import { createHash, randomBytes } from "crypto";
import { prisma } from "./db";
import { getSetting } from "./settings";
import { generateOrderNumber, parseJsonArray } from "./utils";

export const ACTIVE_MATCH_STATUSES = ["SCHEDULED", "TIMED", "POSTPONED"];
export const PAYMENT_SUPPORT_METHODS = ["GOOGLE_PAY", "APPLE_PAY", "CARD"];

export function isMatchPurchasable(match: { kickoffAt: Date; status: string; isVisible: boolean }, now = new Date()) {
  return match.isVisible && match.kickoffAt > now && ACTIVE_MATCH_STATUSES.includes(match.status);
}

export async function releaseExpiredReservations(now = new Date()) {
  const expired = await prisma.inventoryReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: now } },
    select: { id: true, listingId: true, quantity: true },
  });

  let released = 0;
  for (const hold of expired) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.inventoryReservation.updateMany({
        where: { id: hold.id, status: "ACTIVE" },
        data: { status: "EXPIRED" },
      });
      if (claimed.count !== 1) return;
      await tx.ticketListing.update({
        where: { id: hold.listingId },
        data: {
          quantityAvailable: { increment: hold.quantity },
          quantityReserved: { decrement: hold.quantity },
        },
      });
      released += 1;
    });
  }
  return released;
}

export async function reserveInventory(listingId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new Error("Choose between 1 and 10 tickets");
  }

  await releaseExpiredReservations();
  const minutes = Math.max(2, Math.min(30, Number(await getSetting("reservation_minutes")) || 10));
  const expiresAt = new Date(Date.now() + minutes * 60_000);
  const token = randomBytes(24).toString("hex");

  return prisma.$transaction(async (tx) => {
    const listing = await tx.ticketListing.findUnique({
      where: { id: listingId },
      include: { match: true },
    });
    if (!listing || !listing.isActive || !isMatchPurchasable(listing.match)) {
      throw new Error("This ticket listing is no longer available");
    }

    const allowed = parseJsonArray(listing.allowedQuantities).map(Number);
    if (allowed.length && !allowed.includes(quantity)) {
      throw new Error(`This listing is available in quantities of ${allowed.join(", ")}`);
    }

    const changed = await tx.ticketListing.updateMany({
      where: { id: listingId, isActive: true, quantityAvailable: { gte: quantity } },
      data: {
        quantityAvailable: { decrement: quantity },
        quantityReserved: { increment: quantity },
      },
    });
    if (changed.count !== 1) throw new Error("That quantity is no longer available");

    const reservation = await tx.inventoryReservation.create({
      data: { listingId, quantity, token, expiresAt },
    });
    return { reservation, listing };
  });
}

type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
};

export async function createBookingFromReservation(
  token: string,
  customer: CustomerDetails,
  userId?: string | null
) {
  await releaseExpiredReservations();
  const serviceFeePercent = Number(await getSetting("service_fee_percent")) || 0;
  const taxPercent = Number(await getSetting("tax_percent")) || 0;
  const accessToken = randomBytes(24).toString("base64url");

  const booking = await prisma.$transaction(async (tx) => {
    const reservation = await tx.inventoryReservation.findUnique({
      where: { token },
      include: { listing: { include: { match: true } } },
    });
    if (!reservation || reservation.status !== "ACTIVE" || reservation.expiresAt <= new Date()) {
      throw new Error("Your ticket reservation has expired");
    }
    if (!isMatchPurchasable(reservation.listing.match)) {
      throw new Error("Purchasing has closed for this match");
    }

    const subtotal = reservation.listing.price * reservation.quantity;
    const serviceFee = Math.round(subtotal * serviceFeePercent) / 100;
    const taxAmount = Math.round((subtotal + serviceFee) * taxPercent) / 100;
    const total = subtotal + serviceFee + taxAmount;

    const created = await tx.booking.create({
      data: {
        reference: generateOrderNumber(),
        accessTokenHash: createHash("sha256").update(accessToken).digest("hex"),
        userId: userId || null,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerEmail: customer.email.toLowerCase(),
        customerPhone: customer.phone,
        customerCountry: customer.country,
        matchId: reservation.listing.matchId,
        subtotal,
        serviceFee,
        taxAmount,
        total,
        currency: reservation.listing.currency,
        deliveryMethod: reservation.listing.deliveryMethod,
        reservationExpires: reservation.expiresAt,
        items: {
          create: {
            listingId: reservation.listing.id,
            category: reservation.listing.category,
            section: reservation.listing.section,
            row: reservation.listing.row,
            seats: reservation.listing.exactSeats,
            quantity: reservation.quantity,
            unitPrice: reservation.listing.price,
            lineTotal: subtotal,
            ticketType: reservation.listing.ticketType,
            deliveryMethod: reservation.listing.deliveryMethod,
            notes: reservation.listing.notes,
          },
        },
      },
      include: { items: true, match: { include: { venue: true } } },
    });

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: "CONVERTED", bookingId: created.id },
    });
    await tx.ticketListing.update({
      where: { id: reservation.listing.id },
      data: {
        quantityReserved: { decrement: reservation.quantity },
        quantitySold: { increment: reservation.quantity },
      },
    });
    return created;
  });

  return { booking, accessToken };
}

export function safeBookingAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
