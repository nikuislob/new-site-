import { dollarsFromCents } from "@/lib/tickets";

export type PolapinePaymentLinkResult = {
  paymentUrl: string;
  invoiceId: string;
  uniqueId: string;
  paymentLinkId: number | string;
  brandSlug: string;
  amount: number;
  raw: unknown;
};

type PolapineConfig = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  brandSlug: string;
};

export function getPolapineConfig(): PolapineConfig | null {
  const apiKey = process.env.POLAPINE_API_KEY?.trim();
  const apiSecret = process.env.POLAPINE_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;

  const baseUrl = (process.env.POLAPINE_API_BASE_URL?.trim() || "https://pay.polapine.com/api/v1").replace(
    /\/$/,
    ""
  );
  const brandSlug = process.env.POLAPINE_BRAND_SLUG?.trim() || "pitchpass";
  return { apiKey, apiSecret, baseUrl, brandSlug };
}

export function isPolapineConfigured(): boolean {
  return Boolean(getPolapineConfig());
}

function headers(config: PolapineConfig): HeadersInit {
  return {
    "X-API-Key": config.apiKey,
    "X-API-Secret": config.apiSecret,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function parsePolapineCreateResponse(payload: unknown): PolapinePaymentLinkResult {
  const root = asRecord(payload);
  const data = asRecord(root?.data) || root;
  if (!data) throw new Error("Polapine response missing data.");

  const link = asRecord(data.payment_link) || data;
  const urls = asRecord(data.urls) || asRecord(link?.urls) || {};

  const paymentUrl = pickString(
    urls.payment_page,
    urls.payment_url,
    urls.short_url,
    data.payment_url,
    link?.payment_url
  );
  if (!paymentUrl) throw new Error("Polapine response missing payment_page URL.");

  const absoluteUrl = paymentUrl.startsWith("http")
    ? paymentUrl
    : `https://pay.polapine.com${paymentUrl.startsWith("/") ? "" : "/"}${paymentUrl}`;

  const invoiceId = pickString(link?.invoice_id, data.invoice_id);
  const uniqueId = pickString(link?.unique_id, link?.id, data.unique_id, data.id);
  if (!invoiceId && !uniqueId) throw new Error("Polapine response missing invoice/unique id.");

  return {
    paymentUrl: absoluteUrl,
    invoiceId: invoiceId || uniqueId || "",
    uniqueId: uniqueId || invoiceId || "",
    paymentLinkId: (link?.id as number | string) ?? uniqueId ?? invoiceId ?? "",
    brandSlug: pickString(link?.brand_slug, data.brand_slug) || "pitchpass",
    amount: Number(link?.amount ?? data.amount ?? 0),
    raw: payload,
  };
}

export async function createPolapinePaymentLink(input: {
  amountCents: number;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  description?: string;
  redirectUrl: string;
  webhookUrl?: string;
}): Promise<PolapinePaymentLinkResult> {
  const config = getPolapineConfig();
  if (!config) throw new Error("Polapine Cash App API is not configured.");

  const amount = dollarsFromCents(input.amountCents);
  if (amount < 5) throw new Error("Cash App payments require at least $5.");
  if (amount > 500) throw new Error("Cash App payments cannot exceed $500 on this gateway.");

  const body: Record<string, unknown> = {
    amount,
    currency: "USD",
    brand_slug: config.brandSlug,
    order_reference: input.orderNumber,
    customer_email: input.customerEmail,
    description: input.description || `PitchPass order ${input.orderNumber}`,
    redirect_url: input.redirectUrl,
    metadata: {
      order_id: input.orderNumber,
      source: "pitchpass",
    },
  };

  if (input.customerName?.trim()) body.customer_name = input.customerName.trim();
  if (input.webhookUrl?.trim()) body.webhook_url = input.webhookUrl.trim();

  const response = await fetch(`${config.baseUrl}/create-payment-link`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const err =
      asRecord(asRecord(payload)?.data)?.error ||
      asRecord(payload)?.error ||
      `Polapine HTTP ${response.status}`;
    throw new Error(String(err));
  }

  const root = asRecord(payload);
  if (root && root.success === false) {
    const err = asRecord(root.data)?.error || "Polapine payment link creation failed.";
    throw new Error(String(err));
  }

  return parsePolapineCreateResponse(payload);
}

/** Extract order number from webhook payloads with varying shapes. */
export function extractOrderReferenceFromWebhook(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data) || root;
  const metadata = asRecord(data.metadata) || asRecord(root.metadata);

  return pickString(
    data.order_reference,
    root.order_reference,
    metadata?.order_id,
    metadata?.order_reference,
    data.order_id,
    root.order_id,
    asRecord(data.payment_link)?.order_reference,
    asRecord(data.invoice)?.order_reference
  );
}

export function extractPaymentIdsFromWebhook(payload: unknown): {
  invoiceId: string | null;
  uniqueId: string | null;
  transactionId: string | null;
  status: string | null;
} {
  const root = asRecord(payload);
  const data = asRecord(root?.data) || root || {};
  const link = asRecord(data.payment_link) || {};

  return {
    invoiceId: pickString(data.invoice_id, link.invoice_id, data.invoiceId),
    uniqueId: pickString(data.unique_id, link.unique_id, data.payment_link_id, link.id),
    transactionId: pickString(data.transaction_id, root?.transaction_id, data.id),
    status: pickString(data.status, root?.status, root?.event)?.toLowerCase() || null,
  };
}

export function isPaidWebhookEvent(payload: unknown): boolean {
  const root = asRecord(payload);
  const event = pickString(root?.event, root?.type, asRecord(root?.data)?.event)?.toLowerCase() || "";
  const status = extractPaymentIdsFromWebhook(payload).status || "";
  if (event.includes("payment.completed") || event.includes("payment.paid") || event.includes("invoice.paid")) {
    return true;
  }
  return ["paid", "completed", "success", "successful"].includes(status);
}
