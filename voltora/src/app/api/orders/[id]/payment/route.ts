import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl, errorJson, safeJson } from "@/lib/utils";
import { getActivePaymentProvider, verifyGuestOrderToken } from "@/lib/payments/providers";
import { wayCodeFromMethodName } from "@/lib/ggusone";
import { z } from "zod";
import type { CustomerPaymentMethod } from "@/lib/payments/types";

const schema = z.object({
  paymentMethodId: z.string().min(1),
  accessToken: z.string().optional(),
  guestEmail: z.string().email().optional(),
});

type Params = { params: Promise<{ id: string }> };

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function methodToCustomerType(name: string): CustomerPaymentMethod {
  const n = name.toLowerCase();
  if (n.includes("apple")) return "APPLE_PAY";
  if (n.includes("google")) return "GOOGLE_PAY";
  if (n.includes("card") || n.includes("credit") || n.includes("debit")) return "CARD_HOSTED";
  return "EXTERNAL_LINK";
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("paymentMethodId required", 400);

    const user = await getCurrentCustomer();
    const guestEmail = (
      parsed.data.guestEmail ||
      req.headers.get("x-guest-email") ||
      ""
    ).toLowerCase();
    const accessToken = parsed.data.accessToken || req.headers.get("x-order-token") || "";

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true },
    });
    if (!order) return errorJson("Order not found", 404);

    const owns =
      (user && order.userId === user.id) ||
      (guestEmail &&
        accessToken &&
        order.customerEmail === guestEmail &&
        verifyGuestOrderToken(order.orderNumber, guestEmail, accessToken));

    if (!owns) return errorJson("Order not found", 404);

    if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "AWAITING_ASSISTED") {
      return errorJson("Payment already processed for this order", 400);
    }

    // Re-validate inventory before opening payment
    for (const item of order.items) {
      if (item.variantId) {
        const v = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (!v || v.stockQuantity < item.quantity) {
          return errorJson(`Insufficient stock for ${item.productName}`, 400);
        }
      } else if (item.productId) {
        const p = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!p || p.stockQuantity < item.quantity) {
          return errorJson(`Insufficient stock for ${item.productName}`, 400);
        }
      }
    }

    const method = await prisma.paymentMethod.findUnique({
      where: { id: parsed.data.paymentMethodId },
    });
    if (!method || !method.isActive) return errorJson("Payment method not found", 404);
    if (method.slot < 1 || method.slot > 4) return errorJson("Invalid payment method slot", 400);

    // Reject crypto-labeled methods from customer checkout
    const banned = /crypto|bitcoin|btc|usdt|ethereum|wallet address/i;
    if (banned.test(method.name) || banned.test(method.instructions || "")) {
      return errorJson("This payment method is not available for customer checkout", 400);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethodId: method.id,
        paymentMethodName: method.name,
        paymentStatus: "PENDING",
        status: "PAYMENT_PENDING",
      },
    });

    const notifyUrl = absoluteUrl("/api/payments/webhook");
    const successUrl = absoluteUrl(`/order/${order.orderNumber}`);
    const cancelUrl = absoluteUrl(`/checkout?cancelled=1`);

    const provider = getActivePaymentProvider();
    const wayFromInstructions = method.instructions?.match(/WAYCODE:([A-Z0-9_]+)/i)?.[1];

    const created = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountCents: Math.round(order.total * 100),
      currency: "usd",
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      description: `Voltora order ${order.orderNumber}`,
      successUrl: `${successUrl}?token=${accessToken || ""}&email=${encodeURIComponent(order.customerEmail)}`,
      cancelUrl,
      notifyUrl,
      method: methodToCustomerType(method.name),
      clientIp: clientIp(req),
      metadata: {
        paymentUrl: method.paymentUrl,
        wayCode: wayCodeFromMethodName(method.name, wayFromInstructions),
      },
    });

    const paymentUrl = created.paymentUrl || method.paymentUrl;
    if (!paymentUrl.startsWith("https://") && !paymentUrl.startsWith("http://localhost")) {
      return errorJson(created.message || "Payment provider did not return a valid URL", 502);
    }

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { paymentMethod: true, items: true },
    });

    return safeJson({
      order: updated,
      paymentUrl,
      buttonText: method.buttonText,
      instructions: method.instructions,
      provider: created.provider,
      gatewayMsg: created.ok ? undefined : created.message,
      paymentStatus: "PENDING",
    });
  } catch {
    return errorJson("Failed to initiate payment", 500);
  }
}
