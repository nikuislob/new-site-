import { createHmac, timingSafeEqual } from "crypto";

export type CashAppPaymentResult = {
  providerReference: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  checkoutUrl?: string;
  raw: unknown;
};

function cashAppConfig() {
  const apiBase = process.env.CASH_APP_API_BASE_URL;
  const createPath = process.env.CASH_APP_CREATE_PAYMENT_PATH;
  const apiKey = process.env.CASH_APP_API_KEY;
  if (!apiBase || !createPath || !apiKey) {
    throw new Error(
      "Cash App is not configured. Set CASH_APP_API_BASE_URL, CASH_APP_CREATE_PAYMENT_PATH, and CASH_APP_API_KEY from your provider documentation."
    );
  }
  return { apiBase, createPath, apiKey };
}

export async function createCashAppPayment(input: {
  bookingReference: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  returnUrl: string;
  webhookUrl: string;
}): Promise<CashAppPaymentResult> {
  const { apiBase, createPath, apiKey } = cashAppConfig();
  const response = await fetch(new URL(createPath, apiBase), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      merchantReference: input.bookingReference,
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      returnUrl: input.returnUrl,
      webhookUrl: input.webhookUrl,
    }),
  });
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Cash App provider request failed (${response.status})`);

  const payload = raw as Record<string, unknown>;
  const providerReference = String(payload.id || payload.paymentId || "");
  if (!providerReference) throw new Error("Cash App provider response did not include a payment reference");
  return {
    providerReference,
    status: normalizeCashAppStatus(String(payload.status || "PENDING")),
    checkoutUrl: typeof payload.checkoutUrl === "string" ? payload.checkoutUrl : undefined,
    raw,
  };
}

export function normalizeCashAppStatus(status: string): CashAppPaymentResult["status"] {
  const normalized = status.toUpperCase();
  if (["SUCCESS", "SUCCEEDED", "COMPLETED", "PAID"].includes(normalized)) return "SUCCEEDED";
  if (["FAILED", "DECLINED", "ERROR"].includes(normalized)) return "FAILED";
  if (["CANCELLED", "CANCELED", "VOIDED"].includes(normalized)) return "CANCELLED";
  return "PENDING";
}

export function verifyCashAppWebhook(rawBody: string, signature: string | null) {
  const secret = process.env.CASH_APP_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const supplied = signature.replace(/^sha256=/, "");
  if (expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
