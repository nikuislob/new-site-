import { z } from "zod";
import { createCashAppPayment } from "@/lib/cashapp";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PAYMENT_SUPPORT_METHODS, safeBookingAccessToken } from "@/lib/tickets";
import { absoluteUrl, errorJson, safeJson } from "@/lib/utils";

const schema = z.object({
  method: z.enum(["CASH_APP", "GOOGLE_PAY", "APPLE_PAY", "CARD"]),
  accessToken: z.string().optional(),
  idempotencyKey: z.string().min(12).max(100),
});

type Params = { params: Promise<{ reference: string }> };

export async function POST(request: Request, { params }: Params) {
  let paymentId: string | null = null;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid payment request", 400);
    const { reference } = await params;
    const user = await getCurrentCustomer();
    const booking = await prisma.booking.findUnique({
      where: { reference },
      include: { match: true, items: true },
    });
    if (!booking) return errorJson("Booking not found", 404);
    const tokenValid = parsed.data.accessToken &&
      booking.accessTokenHash === safeBookingAccessToken(parsed.data.accessToken);
    if (booking.userId ? booking.userId !== user?.id && !tokenValid : !tokenValid) {
      return errorJson("Access denied", 403);
    }
    if (booking.paymentStatus === "PAID") return errorJson("This booking is already paid", 409);

    const existing = await prisma.payment.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey } });
    if (existing) return safeJson({ payment: existing, reused: true });

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: parsed.data.method,
        idempotencyKey: parsed.data.idempotencyKey,
        amount: booking.total,
        currency: booking.currency,
      },
    });
    paymentId = payment.id;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMethod: parsed.data.method,
        status: PAYMENT_SUPPORT_METHODS.includes(parsed.data.method)
          ? "AWAITING_PAYMENT_CONFIRMATION"
          : "PAYMENT_PROCESSING",
        paymentStatus: PAYMENT_SUPPORT_METHODS.includes(parsed.data.method) ? "PENDING" : "PROCESSING",
      },
    });

    if (PAYMENT_SUPPORT_METHODS.includes(parsed.data.method)) {
      const methodLabel = parsed.data.method.replaceAll("_", " ");
      const conversation = await prisma.conversation.create({
        data: {
          userId: booking.userId,
          guestName: `${booking.customerFirstName} ${booking.customerLastName}`,
          guestEmail: booking.customerEmail,
          bookingId: booking.id,
          subject: `${methodLabel} payment · ${booking.reference}`,
          unreadAdmin: 1,
          messages: {
            create: {
              senderType: "system",
              senderName: "PitchPass",
              body: `Payment assistance requested for ${booking.reference}. ${booking.match.homeTeam} vs ${booking.match.awayTeam}; ${booking.items[0]?.category}, ${booking.items[0]?.section}; quantity ${booking.items[0]?.quantity}; total ${booking.currency} ${booking.total.toFixed(2)}; method ${methodLabel}.`,
            },
          },
        },
      });
      return safeJson({ payment, supportRequired: true, conversationId: conversation.id });
    }

    const provider = await createCashAppPayment({
      bookingReference: booking.reference,
      amount: booking.total,
      currency: booking.currency,
      idempotencyKey: parsed.data.idempotencyKey,
      returnUrl: absoluteUrl(`/booking/${booking.reference}?token=${parsed.data.accessToken || ""}`),
      webhookUrl: absoluteUrl("/api/payments/cash-app/webhook"),
    });
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: provider.providerReference,
        status: provider.status,
        providerPayload: JSON.stringify(provider.raw),
      },
    });
    return safeJson({ payment: updated, checkoutUrl: provider.checkoutUrl, supportRequired: false });
  } catch (error) {
    if (paymentId) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Provider error" },
      }).catch(() => undefined);
    }
    const message = error instanceof Error ? error.message : "Unable to start payment";
    const status = message.startsWith("Cash App is not configured") ? 503 : 502;
    return errorJson(message, status);
  }
}
