import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { ggusoneProvider, stripeProvider } from "@/lib/payments/providers";

/**
 * Unified payment webhook endpoint.
 * Confirms payment only after signature verification + amount match.
 */
export async function POST(req: NextRequest) {
  const rawText = await req.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }

  // Try Stripe first if signature header present
  const stripeSig = req.headers.get("stripe-signature");
  if (stripeSig && process.env.STRIPE_SECRET_KEY) {
    const result = await stripeProvider.handleWebhook?.(req.headers, rawText || json || {});
    if (result?.ok && result.status === "CONFIRMED" && result.orderNumber) {
      const order = await prisma.order.findFirst({ where: { orderNumber: result.orderNumber } });
      if (order) {
        const expected = Math.round(order.total * 100);
        if (result.amountCents != null && Math.abs(result.amountCents - expected) > 1) {
          return new Response("amount_mismatch", { status: 400 });
        }
        try {
          await confirmOrderPayment({
            orderId: order.id,
            paymentMethodName: order.paymentMethodName || "Card",
            adminNotesAppend: `Stripe webhook confirmed ${new Date().toISOString()}`,
            transactionRef: result.providerPaymentId,
          });
        } catch (e) {
          return new Response(e instanceof Error ? e.message : "fail", { status: 400 });
        }
      }
    }
    return new Response("ok", { status: 200 });
  }

  // ggusone / form-style
  const params: Record<string, unknown> = { ...(json || {}) };
  if (!json) {
    const form = await req.formData().catch(() => null);
    if (form) form.forEach((v, k) => (params[k] = String(v)));
  }

  const result = await ggusoneProvider.handleWebhook?.(req.headers, params);
  if (!result?.ok) {
    const wantsJson = (req.headers.get("accept") || "").includes("application/json");
    if (wantsJson) {
      return Response.json({ ok: false, error: result?.message || "Invalid webhook signature" }, { status: 400 });
    }
    return new Response("fail", { status: 400 });
  }

  if (result.status === "CONFIRMED" && result.orderNumber) {
    const order = await prisma.order.findFirst({ where: { orderNumber: result.orderNumber } });
    if (!order) return new Response("fail", { status: 404 });
    const expected = Math.round(order.total * 100);
    if (result.amountCents != null && Math.abs(result.amountCents - expected) > 1) {
      // Also try comparing as dollars*100 if provider sent dollars as int
      const asDollars = Math.round(Number(result.amountCents));
      if (Math.abs(asDollars - expected) > 1 && Math.abs(result.amountCents - order.total) > 0.02) {
        return new Response("amount_mismatch", { status: 400 });
      }
    }
    try {
      await confirmOrderPayment({
        orderId: order.id,
        adminNotesAppend: `Gateway webhook confirmed ${new Date().toISOString()}`,
        transactionRef: result.providerPaymentId,
      });
    } catch (e) {
      return new Response(e instanceof Error ? e.message : "fail", { status: 400 });
    }
  }

  return new Response("success", { status: 200 });
}

export async function GET(req: NextRequest) {
  // Some gateways notify via GET
  const params: Record<string, unknown> = {};
  req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
  const fakeReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(params),
  });
  return POST(fakeReq);
}
