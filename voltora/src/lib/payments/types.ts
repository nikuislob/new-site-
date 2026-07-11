/**
 * Modular payment provider interface.
 * Orchestration (Hyperswitch) is separate from the acquirer (e.g. Stripe).
 * Customer-facing methods: card (hosted), Apple Pay, Google Pay — never crypto.
 */

export type CustomerPaymentMethod =
  | "CARD_HOSTED"
  | "APPLE_PAY"
  | "GOOGLE_PAY"
  | "EXTERNAL_LINK"
  | "ASSISTED_POS";

export type ProviderCreateInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string; // usd
  customerEmail: string;
  customerName: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  method: CustomerPaymentMethod;
  clientIp?: string;
  metadata?: Record<string, string>;
};

export type ProviderCreateResult = {
  ok: boolean;
  provider: string;
  paymentUrl?: string;
  providerPaymentId?: string;
  message?: string;
  raw?: unknown;
};

export type ProviderWebhookResult = {
  ok: boolean;
  orderNumber?: string;
  providerPaymentId?: string;
  amountCents?: number;
  status: "CONFIRMED" | "FAILED" | "CANCELLED" | "PENDING" | "UNKNOWN";
  message?: string;
};

export interface PaymentProvider {
  readonly id: string;
  createPayment(input: ProviderCreateInput): Promise<ProviderCreateResult>;
  getPaymentStatus?(providerPaymentId: string): Promise<ProviderWebhookResult>;
  handleWebhook?(
    headers: Headers,
    rawBody: string | Record<string, unknown>
  ): Promise<ProviderWebhookResult>;
  refundPayment?(providerPaymentId: string, amountCents?: number): Promise<{ ok: boolean; message?: string }>;
  cancelPayment?(providerPaymentId: string): Promise<{ ok: boolean; message?: string }>;
}
