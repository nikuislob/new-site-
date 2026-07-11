import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl, errorJson, safeJson } from "@/lib/utils";
import { createGgPayment, isGgConfigured, wayCodeFromMethodName } from "@/lib/ggusone";
import { z } from "zod";

const schema = z.object({ paymentMethodId: z.string().min(1) });

type Params = { params: Promise<{ id: string }> };

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("paymentMethodId required", 400);

    const user = await getCurrentCustomer();
    const guestEmail = req.headers.get("x-guest-email")?.toLowerCase();

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });
    if (!order) return errorJson("Order not found", 404);

    const owns =
      (user && order.userId === user.id) ||
      (guestEmail && order.customerEmail.toLowerCase() === guestEmail) ||
      (!order.userId && !user); // guest order, same browser right after checkout

    if (!owns) return errorJson("Order not found", 404);

    if (order.paymentStatus !== "PENDING") {
      return errorJson("Payment already processed for this order", 400);
    }

    const method = await prisma.paymentMethod.findUnique({
      where: { id: parsed.data.paymentMethodId },
    });
    if (!method || !method.isActive) return errorJson("Payment method not found", 404);
    if (method.slot < 1 || method.slot > 4) return errorJson("Invalid payment method slot", 400);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethodId: method.id,
        paymentMethodName: method.name,
        paymentStatus: "PENDING",
        status: "PAYMENT_PENDING",
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const notifyUrl = absoluteUrl("/api/payments/ggusone/notify");
    const returnUrl = absoluteUrl(`/order/${order.orderNumber}?paid=pending`);

    // Prefer live gateway when configured; otherwise use admin HTTPS link.
    let paymentUrl = method.paymentUrl;
    let gatewayMsg: string | undefined;
    let tradeNo: string | undefined;

    if (isGgConfigured()) {
      // wayCode stored in instructions first line as WAYCODE:XXX optional, else from name
      const wayFromInstructions = method.instructions?.match(/WAYCODE:([A-Z0-9_]+)/i)?.[1];
      const wayCode = wayCodeFromMethodName(method.name, wayFromInstructions);

      const created = await createGgPayment({
        mchOrderNo: order.orderNumber,
        amountDollars: order.total,
        subject: `Voltora ${order.orderNumber}`,
        wayCode,
        notifyUrl,
        returnUrl,
        clientIp: clientIp(req),
      });

      if (created.ok && created.payUrl) {
        paymentUrl = created.payUrl;
        tradeNo = created.tradeNo;
      } else if (created.payUrl) {
        paymentUrl = created.payUrl;
        gatewayMsg = created.msg;
      } else {
        // Keep configured external link as fallback so checkout still works
        gatewayMsg = created.msg || "Gateway did not return a pay URL; using configured link.";
        if (!paymentUrl.startsWith("https://")) {
          return errorJson(gatewayMsg, 502);
        }
      }

      if (tradeNo) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            adminNotes: [order.adminNotes, `ggusone tradeNo=${tradeNo}`].filter(Boolean).join("\n"),
          },
        });
      }
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
      gatewayMsg,
      appUrl,
      // Still Payment Pending — notify/admin confirms later
      paymentStatus: "PENDING",
    });
  } catch {
    return errorJson("Failed to initiate payment", 500);
  }
}
