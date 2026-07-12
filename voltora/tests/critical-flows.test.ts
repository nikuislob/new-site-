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
import { checkoutSchema, signupSchema } from "@/lib/validators";

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
    expect(adminCan("TICKET_MANAGER", "users")).toBe(true);
    expect(adminCan("SUPPORT_AGENT", "support")).toBe(true);
    expect(adminCan("SUPPORT_AGENT", "payment_links")).toBe(false);
  });
});

describe("support safety", () => {
  it("blocks sensitive content", () => {
    expect(containsSensitiveContent("my password is secret")).toBe(true);
    expect(containsSensitiveContent("I need 2 more tickets")).toBe(false);
  });
});

describe("checkout validation", () => {
  it("rejects more than 2 seats", () => {
    const parsed = checkoutSchema.safeParse({
      matchId: "m1",
      seatIds: ["a", "b", "c"],
      customerName: "Test User",
      customerEmail: "test@example.com",
      paymentMethodCode: "APPLE_PAY",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts 1-2 seat orders", () => {
    const parsed = checkoutSchema.safeParse({
      matchId: "m1",
      seatIds: ["a", "b"],
      customerName: "Test User",
      customerEmail: "test@example.com",
      paymentMethodCode: "CASH_APP",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("signup validation", () => {
  it("requires matching passwords", () => {
    const bad = signupSchema.safeParse({
      fullName: "Fan One",
      email: "fan@example.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(bad.success).toBe(false);
    const good = signupSchema.safeParse({
      fullName: "Fan One",
      email: "fan@example.com",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(good.success).toBe(true);
  });
});
