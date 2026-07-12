import { describe, expect, it } from "vitest";
import {
  calcCartTotals,
  resolvePaymentUrl,
  validateCartLines,
  MAX_TICKETS_PER_ORDER,
} from "../src/lib/tickets";
import { adminCan } from "../src/lib/permissions";

describe("ticket cart rules", () => {
  it("prices basic and premium correctly", () => {
    expect(calcCartTotals([{ matchId: "m1", seatTier: "BASIC", quantity: 1 }]).totalCents).toBe(7000);
    expect(calcCartTotals([{ matchId: "m1", seatTier: "BASIC", quantity: 2 }]).totalCents).toBe(14000);
    expect(calcCartTotals([{ matchId: "m1", seatTier: "PREMIUM", quantity: 1 }]).totalCents).toBe(14000);
    expect(calcCartTotals([{ matchId: "m1", seatTier: "PREMIUM", quantity: 2 }]).totalCents).toBe(28000);
    expect(
      calcCartTotals([
        { matchId: "m1", seatTier: "BASIC", quantity: 1 },
        { matchId: "m1", seatTier: "PREMIUM", quantity: 1 },
      ]).totalCents
    ).toBe(21000);
  });

  it("enforces max 2 tickets", () => {
    expect(validateCartLines([{ matchId: "m1", seatTier: "BASIC", quantity: 3 }])).toContain(
      String(MAX_TICKETS_PER_ORDER)
    );
    expect(
      validateCartLines([
        { matchId: "m1", seatTier: "BASIC", quantity: 1 },
        { matchId: "m2", seatTier: "PREMIUM", quantity: 1 },
      ])
    ).toBeNull();
  });
});

describe("payment link resolution", () => {
  it("fills {amount} from cart total", () => {
    expect(resolvePaymentUrl("https://cash.app/$PitchPassDemo/{amount}", 7000)).toBe(
      "https://cash.app/$PitchPassDemo/70"
    );
    expect(resolvePaymentUrl("https://cash.app/$PitchPassDemo/{amount}", 28000)).toBe(
      "https://cash.app/$PitchPassDemo/280"
    );
  });

  it("prefers amount-specific override", () => {
    expect(
      resolvePaymentUrl("https://cash.app/$PitchPassDemo/{amount}", 14000, "https://example.com/pay/cashapp/140")
    ).toBe("https://example.com/pay/cashapp/140");
  });
});

describe("admin permissions", () => {
  it("allows super admin everything", () => {
    expect(adminCan("SUPER_ADMIN", "payments")).toBe(true);
    expect(adminCan("SUPER_ADMIN", "matches")).toBe(true);
  });

  it("restricts support agent from payments", () => {
    expect(adminCan("SUPPORT_AGENT", "payments")).toBe(false);
    expect(adminCan("SUPPORT_AGENT", "support")).toBe(true);
  });
});
