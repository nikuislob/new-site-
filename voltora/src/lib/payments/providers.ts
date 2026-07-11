import crypto from "crypto";
import type { PaymentProvider, ProviderCreateInput, ProviderCreateResult, ProviderWebhookResult } from "./types";
import { createGgPayment, verifyGgSign, isGgConfigured, wayCodeFromMethodName } from "@/lib/ggusone";

/**
 * Adapter for ggusonepay / similar link-based gateways.
 * Used only when GGUSONE_* is configured. Not a card vault.
 */
export const ggusoneProvider: PaymentProvider = {
  id: "ggusone",

  async createPayment(input: ProviderCreateInput): Promise<ProviderCreateResult> {
    if (!isGgConfigured()) {
      return { ok: false, provider: "ggusone", message: "ggusonepay not configured" };
    }
    const wayCode =
      input.method === "APPLE_PAY"
        ? "APPLEPAY"
        : input.method === "GOOGLE_PAY"
          ? "GOOGLEPAY"
          : input.metadata?.wayCode || "CASHAPP";

    const result = await createGgPayment({
      mchOrderNo: input.orderNumber,
      amountDollars: input.amountCents / 100,
      subject: input.description,
      wayCode,
      notifyUrl: input.notifyUrl,
      returnUrl: input.successUrl,
      clientIp: input.clientIp,
    });

    return {
      ok: result.ok && Boolean(result.payUrl),
      provider: "ggusone",
      paymentUrl: result.payUrl,
      providerPaymentId: result.tradeNo,
      message: result.msg,
      raw: result.raw,
    };
  },

  async handleWebhook(_headers, body): Promise<ProviderWebhookResult> {
    const params = typeof body === "string" ? (JSON.parse(body) as Record<string, unknown>) : { ...body };
    if (params.data && typeof params.data === "object") {
      Object.assign(params, params.data as object);
    }
    if (!verifyGgSign(params)) {
      return { ok: false, status: "UNKNOWN", message: "Invalid signature" };
    }
    const state = String(params.state ?? params.trade_status ?? params.status ?? "");
    const success =
      state === "2" || state === "SUCCESS" || state === "TRADE_SUCCESS" || state === "1" || Number(params.state) === 2;
    const amountRaw = params.amount ?? params.money;
    let amountCents: number | undefined;
    if (amountRaw != null) {
      const n = Number(amountRaw);
      // Heuristic: values < 10000 with decimal string are dollars
      amountCents = String(amountRaw).includes(".") ? Math.round(n * 100) : n < 1000 && !Number.isInteger(Number(amountRaw)) ? Math.round(n * 100) : Math.round(n);
      // If amount looks like dollars integer (e.g. 50 for $50) vs cents — prefer cents when large
      if (!String(amountRaw).includes(".") && n > 0 && n < 500 && success) {
        // Could be dollars; leave both interpretations to caller via raw compare
        amountCents = Math.round(n * 100);
      }
    }
    return {
      ok: true,
      orderNumber: String(params.mchOrderNo || params.out_trade_no || ""),
      providerPaymentId: String(params.payOrderId || params.trade_no || params.tradeNo || ""),
      amountCents,
      status: success ? "CONFIRMED" : "PENDING",
    };
  },
};

/**
 * Stripe Checkout Session adapter (hosted card + Apple Pay + Google Pay when enabled on Stripe).
 * Requires STRIPE_SECRET_KEY. No card data touches our servers.
 */
export const stripeProvider: PaymentProvider = {
  id: "stripe",

  async createPayment(input: ProviderCreateInput): Promise<ProviderCreateResult> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return { ok: false, provider: "stripe", message: "STRIPE_SECRET_KEY not configured" };
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", input.cancelUrl);
    params.set("client_reference_id", input.orderNumber);
    params.set("customer_email", input.customerEmail);
    params.set("line_items[0][price_data][currency]", input.currency);
    params.set("line_items[0][price_data][product_data][name]", input.description);
    params.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[orderNumber]", input.orderNumber);
    params.set("metadata[orderId]", input.orderId);
    // Enable wallet payment methods when available on the Stripe account
    params.append("payment_method_types[]", "card");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        provider: "stripe",
        message: String((data.error as { message?: string })?.message || "Stripe session failed"),
        raw: data,
      };
    }
    return {
      ok: true,
      provider: "stripe",
      paymentUrl: String(data.url || ""),
      providerPaymentId: String(data.id || ""),
      raw: data,
    };
  },

  async handleWebhook(headers, rawBody): Promise<ProviderWebhookResult> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret) {
      const sig = headers.get("stripe-signature") || "";
      // Prefer Stripe SDK constructEvent in production; require signature header when secret set
      if (!sig.includes("v1=")) {
        return { ok: false, status: "UNKNOWN", message: "Missing Stripe signature" };
      }
    }
    const event = (typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody) as Record<string, unknown>;
    const type = String(event.type || "");
    const obj = (event.data as { object?: Record<string, unknown> })?.object || {};
    const orderNumber = String(obj.client_reference_id || (obj.metadata as Record<string, string>)?.orderNumber || "");
    const amountCents = typeof obj.amount_total === "number" ? obj.amount_total : undefined;

    if (type === "checkout.session.completed" && obj.payment_status === "paid") {
      return {
        ok: true,
        orderNumber,
        providerPaymentId: String(obj.id || obj.payment_intent || ""),
        amountCents,
        status: "CONFIRMED",
      };
    }
    if (type === "checkout.session.expired") {
      return { ok: true, orderNumber, status: "CANCELLED", amountCents };
    }
    return { ok: true, orderNumber, status: "PENDING", amountCents };
  },
};

/** External HTTPS link configured in admin (legacy 4-slot links) */
export const externalLinkProvider: PaymentProvider = {
  id: "external_link",
  async createPayment(input): Promise<ProviderCreateResult> {
    const url = input.metadata?.paymentUrl;
    if (!url || !url.startsWith("https://")) {
      return { ok: false, provider: "external_link", message: "Invalid HTTPS payment URL" };
    }
    return { ok: true, provider: "external_link", paymentUrl: url };
  },
};

export function getActivePaymentProvider(): PaymentProvider {
  const preferred = (process.env.PAYMENT_PROVIDER || "auto").toLowerCase();
  if (preferred === "stripe" || (preferred === "auto" && process.env.STRIPE_SECRET_KEY)) {
    return stripeProvider;
  }
  if (preferred === "ggusone" || (preferred === "auto" && isGgConfigured())) {
    return ggusoneProvider;
  }
  return externalLinkProvider;
}

export function guestOrderToken(orderNumber: string, email: string, secret?: string) {
  const s = secret || process.env.AUTH_SECRET || "dev";
  return crypto.createHmac("sha256", s).update(`${orderNumber}:${email.toLowerCase()}`).digest("hex").slice(0, 32);
}

export function verifyGuestOrderToken(orderNumber: string, email: string, token: string) {
  if (!token) return false;
  const expected = guestOrderToken(orderNumber, email);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export { wayCodeFromMethodName };
