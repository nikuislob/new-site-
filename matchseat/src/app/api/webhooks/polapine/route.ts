import { prisma } from "@/lib/db";
import {
  extractOrderReferenceFromWebhook,
  extractPaymentIdsFromWebhook,
  isPaidWebhookEvent,
} from "@/lib/polapine";
import { errorJson, safeJson } from "@/lib/utils";

/**
 * Polapine Digital (pd.cash / Cash App gateway) webhook.
 * Confirms PitchPass orders when payment.completed (or equivalent) arrives.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return errorJson("Invalid webhook payload.", 400);
  }

  if (!isPaidWebhookEvent(payload)) {
    return safeJson({ received: true, ignored: true });
  }

  const orderNumber = extractOrderReferenceFromWebhook(payload);
  const ids = extractPaymentIdsFromWebhook(payload);

  const order =
    (orderNumber
      ? await prisma.order.findUnique({ where: { orderNumber } })
      : null) ||
    (ids.invoiceId
      ? await prisma.order.findFirst({ where: { paymentExternalId: ids.invoiceId } })
      : null) ||
    (ids.uniqueId
      ? await prisma.order.findFirst({ where: { paymentExternalId: ids.uniqueId } })
      : null);

  if (!order) {
    return safeJson({ received: true, matched: false }, 202);
  }

  if (order.paymentStatus === "CONFIRMED" || order.status === "FULFILLED") {
    return safeJson({ received: true, matched: true, alreadyConfirmed: true });
  }

  const noteBits = [
    order.notes,
    `Polapine webhook confirmed at ${new Date().toISOString()}`,
    ids.transactionId ? `txn=${ids.transactionId}` : null,
    ids.invoiceId ? `invoice=${ids.invoiceId}` : null,
  ].filter(Boolean);

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "CONFIRMED",
      status: order.status === "CANCELLED" ? order.status : "PAID",
      paymentExternalId: order.paymentExternalId || ids.invoiceId || ids.uniqueId,
      paymentProvider: order.paymentProvider || "POLAPINE",
      notes: noteBits.join(" | "),
    },
  });

  return safeJson({ received: true, matched: true, orderNumber: order.orderNumber });
}

export async function GET() {
  return safeJson({ ok: true, endpoint: "polapine-webhook" });
}
