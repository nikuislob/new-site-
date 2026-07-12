/** Ticket pricing — Basic $70, Premium $140. Max 2 tickets per customer order. */
export const BASIC_PRICE_CENTS = 7000;
export const PREMIUM_PRICE_CENTS = 14000;
export const MAX_TICKETS_PER_ORDER = 2;

export type SeatTier = "BASIC" | "PREMIUM";

export const SEAT_TIERS: Record<
  SeatTier,
  { label: string; priceCents: number; description: string; sectionHint: string }
> = {
  BASIC: {
    label: "Basic Seat",
    priceCents: BASIC_PRICE_CENTS,
    description: "Lower / upper bowl seating with a clear pitch view.",
    sectionHint: "Sections 101–140 · Bowl",
  },
  PREMIUM: {
    label: "Premium Seat",
    priceCents: PREMIUM_PRICE_CENTS,
    description: "Club-level seats closer to the action with wider chairs.",
    sectionHint: "Club Level · Midfield",
  },
};

/** Possible cart totals with max 2 tickets (cents). */
export const POSSIBLE_TOTALS_CENTS = [7000, 14000, 21000, 28000] as const;

export type CartLine = {
  matchId: string;
  seatTier: SeatTier;
  quantity: number;
};

export function priceForTier(tier: SeatTier): number {
  return SEAT_TIERS[tier].priceCents;
}

export function calcCartTotals(lines: CartLine[]) {
  const ticketCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalCents = lines.reduce(
    (sum, l) => sum + priceForTier(l.seatTier) * l.quantity,
    0
  );
  return { ticketCount, subtotalCents, totalCents: subtotalCents };
}

export function validateCartLines(lines: CartLine[]): string | null {
  if (!lines.length) return "Add at least one ticket.";
  const ticketCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  if (ticketCount < 1) return "Add at least one ticket.";
  if (ticketCount > MAX_TICKETS_PER_ORDER) {
    return `Maximum ${MAX_TICKETS_PER_ORDER} tickets per customer.`;
  }
  for (const line of lines) {
    if (line.quantity < 1) return "Invalid ticket quantity.";
    if (line.seatTier !== "BASIC" && line.seatTier !== "PREMIUM") {
      return "Invalid seat type.";
    }
  }
  return null;
}

/**
 * Resolve payment URL for a cart total.
 * Prefers amount-specific override; otherwise fills {amount} in the method template.
 * Example template: https://cash.app/$YourCashtag/{amount}
 */
export function resolvePaymentUrl(
  urlTemplate: string,
  amountCents: number,
  overrideUrl?: string | null
): string {
  if (overrideUrl && overrideUrl.trim()) return overrideUrl.trim();
  const dollars = Math.round(amountCents / 100);
  return urlTemplate
    .replaceAll("{amount}", String(dollars))
    .replaceAll("{amountCents}", String(amountCents))
    .replaceAll("{dollars}", String(dollars));
}

export function dollarsFromCents(cents: number): number {
  return Math.round(cents / 100);
}
