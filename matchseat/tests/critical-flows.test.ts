import { describe, expect, it } from "vitest";
import {
  calcCartTotals,
  resolvePaymentUrl,
  validateCartLines,
  MAX_TICKETS_PER_ORDER,
} from "../src/lib/tickets";
import { adminCan } from "../src/lib/permissions";
import {
  extractOrderReferenceFromWebhook,
  isPaidWebhookEvent,
  parsePolapineCreateResponse,
} from "../src/lib/polapine";

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

describe("polapine response parsing", () => {
  it("parses create-payment-link response", () => {
    const parsed = parsePolapineCreateResponse({
      success: true,
      data: {
        payment_link: {
          id: 3510,
          unique_id: "tige-rkjfa0zh",
          invoice_id: "QULCIJ195N37DGKE",
          brand_slug: "pitchpass",
          amount: 70,
        },
        urls: {
          payment_page:
            "https://pay.polapine.com/pay/@pitchpass/QULCIJ195N37DGKE?email=buyer%2540example.com&amount=70&step=payment",
        },
      },
    });
    expect(parsed.invoiceId).toBe("QULCIJ195N37DGKE");
    expect(parsed.paymentUrl).toContain("pay.polapine.com/pay/@pitchpass/");
  });

  it("detects paid webhook events and order references", () => {
    const payload = {
      event: "payment.completed",
      data: {
        status: "completed",
        order_reference: "PP-ABC123",
        invoice_id: "INV1",
        metadata: { order_id: "PP-ABC123" },
      },
    };
    expect(isPaidWebhookEvent(payload)).toBe(true);
    expect(extractOrderReferenceFromWebhook(payload)).toBe("PP-ABC123");
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
