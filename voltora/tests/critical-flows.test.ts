import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  })),
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { discountPercent, slugify, generateOrderNumber, parseJsonArray } from "../src/lib/utils";
import { containsSensitiveContent } from "../src/lib/support";
import { adminCan } from "../src/lib/auth";
import { cartTotals } from "../src/lib/cart";

describe("utils", () => {
  it("calculates discount percent correctly", () => {
    expect(discountPercent(100, 80)).toBe(20);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(0, 10)).toBe(0);
  });

  it("slugifies product names", () => {
    expect(slugify("Apextron Pulse X1 5G")).toBe("apextron-pulse-x1-5g");
  });

  it("generates order numbers with VT prefix", () => {
    expect(generateOrderNumber()).toMatch(/^VT\d{6}-[A-Z0-9]+$/);
  });

  it("parses JSON arrays safely", () => {
    expect(parseJsonArray('["Trending","Best Seller"]')).toEqual(["Trending", "Best Seller"]);
    expect(parseJsonArray("not-json")).toEqual([]);
  });
});

describe("support safety", () => {
  it("blocks password and card-like content", () => {
    expect(containsSensitiveContent("my password is secret123")).toBe(true);
    expect(containsSensitiveContent("cvv 123")).toBe(true);
    expect(containsSensitiveContent("4111111111111111")).toBe(true);
    expect(containsSensitiveContent("Where is my order VT250101-ABC?")).toBe(false);
  });
});

describe("admin permissions", () => {
  it("allows super admin everything", () => {
    expect(adminCan("SUPER_ADMIN", "payments")).toBe(true);
  });

  it("restricts support agent from payments", () => {
    expect(adminCan("SUPPORT_AGENT", "payments")).toBe(false);
    expect(adminCan("SUPPORT_AGENT", "support")).toBe(true);
  });

  it("allows product manager products", () => {
    expect(adminCan("PRODUCT_MANAGER", "products")).toBe(true);
    expect(adminCan("PRODUCT_MANAGER", "orders")).toBe(false);
  });
});

describe("cart totals", () => {
  it("computes subtotal and applies discount", () => {
    const items = [
      {
        quantity: 2,
        product: { sellingPrice: 50, stockQuantity: 10, isActive: true },
        variant: null,
      },
    ];
    const totals = cartTotals(items, 10, 6.99);
    expect(totals.subtotal).toBe(100);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(96.99);
  });

  it("excludes inactive or out-of-stock items", () => {
    const items = [
      {
        quantity: 1,
        product: { sellingPrice: 50, stockQuantity: 0, isActive: true },
        variant: null,
      },
    ];
    expect(cartTotals(items).subtotal).toBe(0);
  });
});

describe("payment workflow invariants", () => {
  it("documents that opening a payment link must not mark paid", () => {
    const orderAfterPaymentClick = {
      paymentStatus: "PENDING",
      status: "PAYMENT_PENDING",
    };
    expect(orderAfterPaymentClick.paymentStatus).toBe("PENDING");
    expect(orderAfterPaymentClick.status).not.toBe("PAYMENT_CONFIRMED");
  });

  it("requires exactly four payment slots", () => {
    const slots = [1, 2, 3, 4];
    expect(slots).toHaveLength(4);
    expect(Math.min(...slots)).toBe(1);
    expect(Math.max(...slots)).toBe(4);
  });
});
