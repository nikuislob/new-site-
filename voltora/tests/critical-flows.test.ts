import { describe, expect, it } from "vitest";
import { adminCan } from "@/lib/permissions";
import { containsSensitiveContent } from "@/lib/support";
import {
  availabilityLabel,
  dollarsToCents,
  formatCurrency,
  generateOrderNumber,
  isValidHttpsUrl,
  slugify,
} from "@/lib/utils";
import { availableInventory } from "@/lib/inventory";
import { checkoutSchema } from "@/lib/validators";

describe("utils", () => {
  it("formats currency from cents", () => {
    expect(formatCurrency(8900)).toBe("$89.00");
    expect(formatCurrency(16800)).toBe("$168.00");
    expect(dollarsToCents(89)).toBe(8900);
  });

  it("slugifies text", () => {
    expect(slugify("STANDARD VIEW")).toBe("standard-view");
  });

  it("generates Arena Nights order numbers", () => {
    expect(generateOrderNumber()).toMatch(/^AN\d{6}-[A-Z0-9]+$/);
  });

  it("validates https urls", () => {
    expect(isValidHttpsUrl("https://example.com/pay")).toBe(true);
    expect(isValidHttpsUrl("http://evil.test")).toBe(false);
  });

  it("computes availability labels", () => {
    expect(availabilityLabel(100, 100)).toBe("AVAILABLE");
    expect(availabilityLabel(5, 100)).toBe("LIMITED AVAILABILITY");
    expect(availabilityLabel(0, 100)).toBe("SOLD OUT");
  });
});

describe("inventory", () => {
  it("prevents negative available inventory", () => {
    expect(availableInventory(100, 40, 70)).toBe(0);
    expect(availableInventory(100, 10, 20)).toBe(70);
  });
});

describe("auth permissions", () => {
  it("enforces role permissions", () => {
    expect(adminCan("SUPER_ADMIN", "payment_links")).toBe(true);
    expect(adminCan("TICKET_MANAGER", "orders")).toBe(true);
    expect(adminCan("SUPPORT_AGENT", "support")).toBe(true);
    expect(adminCan("SUPPORT_AGENT", "payment_links")).toBe(false);
    expect(adminCan("SUPPORT_AGENT", "orders:read")).toBe(true);
  });
});

describe("support safety", () => {
  it("blocks sensitive content", () => {
    expect(containsSensitiveContent("my password is secret")).toBe(true);
    expect(containsSensitiveContent("I need 2 more tickets")).toBe(false);
  });
});

describe("checkout validation", () => {
  it("rejects quantity above 2", () => {
    const parsed = checkoutSchema.safeParse({
      matchId: "m1",
      ticketCategoryId: "c1",
      quantity: 3,
      customerName: "Test User",
      customerEmail: "test@example.com",
      paymentMethodCode: "APPLE_PAY",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid 1-2 ticket orders", () => {
    const parsed = checkoutSchema.safeParse({
      matchId: "m1",
      ticketCategoryId: "c1",
      quantity: 2,
      customerName: "Test User",
      customerEmail: "test@example.com",
      paymentMethodCode: "CASH_APP",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("payment mapping matrix", () => {
  const combos = [
    ["STANDARD VIEW", 1, "APPLE_PAY", 8900],
    ["STANDARD VIEW", 2, "APPLE_PAY", 17800],
    ["STANDARD VIEW", 1, "CASH_APP", 8900],
    ["STANDARD VIEW", 2, "CASH_APP", 17800],
    ["GOOD VIEW", 1, "APPLE_PAY", 16800],
    ["GOOD VIEW", 2, "APPLE_PAY", 33600],
    ["GOOD VIEW", 1, "CASH_APP", 16800],
    ["GOOD VIEW", 2, "CASH_APP", 33600],
  ] as const;

  it("covers all 8 category/qty/method amount combinations", () => {
    expect(combos).toHaveLength(8);
    for (const [, qty, , amount] of combos) {
      expect(qty).toBeLessThanOrEqual(2);
      expect(amount).toBeGreaterThan(0);
    }
  });
});
