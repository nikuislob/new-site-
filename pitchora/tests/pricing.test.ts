import { describe, expect, it } from "vitest";
import { calculateOrderTotals } from "../src/lib/pricing";
import type { Settings } from "@prisma/client";

const baseSettings = {
  id: "default",
  upperSeatPrice: 89,
  closerSeatPrice: 218,
  maxTicketsPerOrder: 2,
  serviceFeeEnabled: false,
  serviceFeePercent: 0,
  taxEnabled: false,
  taxPercent: 0,
  uniquePaymentEnabled: false,
  upperApplePayUrl: "https://apple.com",
  upperCashAppUrl: "https://cash.app",
  closerApplePayUrl: "https://apple.com",
  closerCashAppUrl: "https://cash.app",
  siteName: "Pitchora",
  heroHeadline: "",
  heroSubheadline: "",
  heroImageUrl: null,
  contactEmail: "a@b.c",
  contactPhone: "",
  contactAddress: "",
  whatsappUrl: "",
  liveChatEnabled: true,
  footerText: "",
  faqJson: "[]",
  privacyPolicy: "",
  termsAndConditions: "",
  updatedAt: new Date(),
} as Settings;

describe("pricing", () => {
  it("calculates upper seat totals", () => {
    const one = calculateOrderTotals(baseSettings, "UPPER", 1);
    expect(one.originalTotal).toBe(89);
    const two = calculateOrderTotals(baseSettings, "UPPER", 2);
    expect(two.originalTotal).toBe(178);
  });

  it("calculates closer seat totals", () => {
    const one = calculateOrderTotals(baseSettings, "CLOSER", 1);
    expect(one.originalTotal).toBe(218);
    const two = calculateOrderTotals(baseSettings, "CLOSER", 2);
    expect(two.originalTotal).toBe(436);
  });
});
