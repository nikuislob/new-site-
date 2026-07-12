/**
 * Payment redirect mapping by ticket category + quantity.
 * Max 2 tickets per online transaction; 3+ requires Chat Now / contact form.
 */

export const MAX_ONLINE_TICKETS = 2;

export type PaymentLinkKey = "BASIC_1" | "BASIC_2" | "PREMIUM_1" | "PREMIUM_2";

export const PAYMENT_AMOUNTS: Record<PaymentLinkKey, number> = {
  BASIC_1: 70.5,
  BASIC_2: 141,
  PREMIUM_1: 141,
  PREMIUM_2: 282,
};

export function resolvePaymentLinkKey(
  categoryCode: string,
  quantity: number
): PaymentLinkKey | null {
  if (quantity < 1 || quantity > MAX_ONLINE_TICKETS) return null;
  const code = categoryCode.toUpperCase();
  if (code === "BASIC") {
    return quantity === 1 ? "BASIC_1" : "BASIC_2";
  }
  if (code === "PREMIUM") {
    return quantity === 1 ? "PREMIUM_1" : "PREMIUM_2";
  }
  return null;
}

export function expectedAmount(categoryCode: string, quantity: number): number | null {
  const key = resolvePaymentLinkKey(categoryCode, quantity);
  if (!key) return null;
  return PAYMENT_AMOUNTS[key];
}

export function canCheckoutOnline(quantity: number): boolean {
  return quantity >= 1 && quantity <= MAX_ONLINE_TICKETS;
}
