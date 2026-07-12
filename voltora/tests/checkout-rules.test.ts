import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validators";
import { TICKET_PRICES } from "@/lib/utils";

describe("PitchPass USA checkout rules", () => {
  it("prices are fixed to blueprint tiers", () => {
    expect(TICKET_PRICES.standard).toBe(85);
    expect(TICKET_PRICES.premium).toBe(150);
  });

  it("accepts quantity 1 and 2", () => {
    const one = checkoutSchema.safeParse({
      matchId: "550e8400-e29b-41d4-a716-446655440000",
      customerEmail: "fan@example.com",
      ticketType: "standard",
      quantity: 1,
    });
    const two = checkoutSchema.safeParse({
      matchId: "550e8400-e29b-41d4-a716-446655440000",
      customerEmail: "fan@example.com",
      ticketType: "premium",
      quantity: 2,
    });
    expect(one.success).toBe(true);
    expect(two.success).toBe(true);
  });

  it("schema still parses quantity > 2 so API can reject with 400", () => {
    // Quantity max is enforced in route/order service, not zod max,
    // matching the blueprint's explicit backend security rule.
    const parsed = checkoutSchema.safeParse({
      matchId: "550e8400-e29b-41d4-a716-446655440000",
      customerEmail: "fan@example.com",
      ticketType: "standard",
      quantity: 3,
    });
    expect(parsed.success).toBe(true);
  });
});
