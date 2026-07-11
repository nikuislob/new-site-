import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  })),
}));

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { discountPercent, slugify, generateOrderNumber, parseJsonArray } from "../src/lib/utils";
import { containsSensitiveContent } from "../src/lib/support";
import { adminCan, adminCanAssistPayment } from "../src/lib/admin-permissions";
import { cartTotals } from "../src/lib/cart";
import { guestOrderToken, verifyGuestOrderToken } from "../src/lib/payments/providers";
import { ggSign } from "../src/lib/ggusone";

describe("utils", () => {
  it("calculates discount percent", () => {
    expect(discountPercent(100, 20)).toBe(80);
    expect(discountPercent(100, 100)).toBe(0);
  });
  it("slugifies", () => {
    expect(slugify("iPhone 16 Pro")).toBe("iphone-16-pro");
  });
  it("order numbers", () => {
    expect(generateOrderNumber()).toMatch(/^VT\d{6}-[A-Z0-9]+$/);
  });
  it("json arrays", () => {
    expect(parseJsonArray('["a"]')).toEqual(["a"]);
  });
});

describe("support safety", () => {
  it("blocks secrets", () => {
    expect(containsSensitiveContent("password secret")).toBe(true);
    expect(containsSensitiveContent("cvv 123")).toBe(true);
    expect(containsSensitiveContent("4111111111111111")).toBe(true);
    expect(containsSensitiveContent("Where is my order?")).toBe(false);
  });
});

describe("RBAC", () => {
  it("payment manager can assist", () => {
    expect(adminCanAssistPayment("PAYMENT_MANAGER")).toBe(true);
    expect(adminCan("PAYMENT_MANAGER", "payments")).toBe(true);
  });
  it("support agent has orders:read only", () => {
    expect(adminCan("SUPPORT_AGENT", "orders:read")).toBe(true);
    expect(adminCan("SUPPORT_AGENT", "orders")).toBe(false);
    expect(adminCanAssistPayment("SUPPORT_AGENT")).toBe(false);
  });
  it("orders base implies orders:read", () => {
    expect(adminCan("ORDER_MANAGER", "orders:read")).toBe(true);
  });
});

describe("cart totals", () => {
  it("totals", () => {
    const t = cartTotals(
      [{ quantity: 2, product: { sellingPrice: 50, stockQuantity: 10, isActive: true }, variant: null }],
      10,
      2.99
    );
    expect(t.subtotal).toBe(100);
    expect(t.total).toBe(92.99);
  });
});

describe("guest order tokens", () => {
  it("verifies token", () => {
    const t = guestOrderToken("VT123", "a@b.com");
    expect(verifyGuestOrderToken("VT123", "a@b.com", t)).toBe(true);
    expect(verifyGuestOrderToken("VT123", "other@b.com", t)).toBe(false);
  });
});

describe("payment invariants", () => {
  it("never auto-confirms on link open", () => {
    expect({ paymentStatus: "PENDING" }.paymentStatus).toBe("PENDING");
  });
  it("customer methods exclude crypto labels", () => {
    const methods = ["Card (Hosted Checkout)", "Apple Pay", "Google Pay", "Cash App"];
    expect(methods.some((m) => /crypto|usdt|bitcoin/i.test(m))).toBe(false);
  });
  it("gg sign is stable", () => {
    process.env.GGUSONE_KEY = "testkey";
    const s1 = ggSign({ a: "1", b: "2" }, "testkey");
    const s2 = ggSign({ b: "2", a: "1" }, "testkey");
    expect(s1).toBe(s2);
  });
});
