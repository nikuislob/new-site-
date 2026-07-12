import type { Settings } from "@prisma/client";
import { uniquePaymentOffset } from "./utils";

export type TicketCategory = "UPPER" | "CLOSER";

export function getUnitPrice(settings: Settings, category: TicketCategory): number {
  return category === "UPPER" ? settings.upperSeatPrice : settings.closerSeatPrice;
}

export function getPaymentLinks(settings: Settings, category: TicketCategory) {
  if (category === "UPPER") {
    return {
      applePayUrl: settings.upperApplePayUrl,
      cashAppUrl: settings.upperCashAppUrl,
    };
  }
  return {
    applePayUrl: settings.closerApplePayUrl,
    cashAppUrl: settings.closerCashAppUrl,
  };
}

export function calculateOrderTotals(
  settings: Settings,
  category: TicketCategory,
  quantity: number
) {
  const unitPrice = getUnitPrice(settings, category);
  const subtotal = unitPrice * quantity;
  const serviceFee = settings.serviceFeeEnabled
    ? Math.round(subtotal * (settings.serviceFeePercent / 100) * 100) / 100
    : 0;
  const taxAmount = settings.taxEnabled
    ? Math.round(subtotal * (settings.taxPercent / 100) * 100) / 100
    : 0;
  const originalTotal = Math.round((subtotal + serviceFee + taxAmount) * 100) / 100;
  const paymentAmount = settings.uniquePaymentEnabled
    ? Math.round((originalTotal + uniquePaymentOffset()) * 100) / 100
    : originalTotal;

  return { unitPrice, subtotal, serviceFee, taxAmount, originalTotal, paymentAmount };
}
