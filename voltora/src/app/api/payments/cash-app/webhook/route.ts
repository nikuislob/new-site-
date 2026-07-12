import { normalizeCashAppStatus, verifyCashAppWebhook } from "@/lib/cashapp";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyCashAppWebhook(rawBody, request.headers.get("x-cash-app-signature"))) {
    return errorJson("Invalid webhook signature", 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorJson("Invalid webhook payload", 400);
  }
  const providerReference = String(payload.id || payload.paymentId || "");
  if (!providerReference) return errorJson("Missing payment reference", 400);
  const status = normalizeCashAppStatus(String(payload.status || "PENDING"));

  const payment = await prisma.payment.findUnique({ where: { providerReference } });
  if (!payment) return errorJson("Payment not found", 404);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status, providerPayload: rawBody },
    });
    if (status === "SUCCEEDED") {
      const booking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: "PAID", status: "PAID", paidAt: new Date() },
      });
      await tx.ticketDelivery.upsert({
        where: { id: `delivery-${booking.id}` },
        create: {
          id: `delivery-${booking.id}`,
          bookingId: booking.id,
          method: booking.deliveryMethod,
        },
        update: {},
      });
    } else if (status === "FAILED" || status === "CANCELLED") {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: status, status: "AWAITING_PAYMENT" },
      });
    }
  });

  return safeJson({ received: true });
}
