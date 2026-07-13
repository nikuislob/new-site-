import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { releaseExpiredReservations } from "@/lib/tickets";
import { errorJson, safeJson } from "@/lib/utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  await releaseExpiredReservations();
  const { token } = await params;
  const reservation = await prisma.inventoryReservation.findUnique({
    where: { token },
    include: { listing: { include: { match: { include: { venue: true } } } } },
  });
  if (!reservation || reservation.status !== "ACTIVE" || reservation.expiresAt <= new Date()) {
    return errorJson("Reservation expired or unavailable", 410);
  }
  const subtotal = reservation.listing.price * reservation.quantity;
  const serviceFee = Math.round(subtotal * (Number(await getSetting("service_fee_percent")) || 0)) / 100;
  const taxAmount = Math.round((subtotal + serviceFee) * (Number(await getSetting("tax_percent")) || 0)) / 100;
  return safeJson({ reservation, pricing: { subtotal, serviceFee, taxAmount, total: subtotal + serviceFee + taxAmount } });
}
