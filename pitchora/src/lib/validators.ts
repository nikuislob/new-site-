import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export const bulkRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  matchId: z.string().optional(),
  matchLabel: z.string().optional(),
  quantity: z.number().int().min(3).max(100),
  message: z.string().optional(),
});

export const checkoutSchema = z.object({
  matchId: z.string().min(1),
  ticketCategory: z.enum(["UPPER", "CLOSER"]),
  seatIds: z.array(z.string()).min(1).max(2),
  holdToken: z.string().min(8).optional(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  paymentMethod: z.enum(["APPLE_PAY", "CASH_APP"]),
});

export const matchSchema = z.object({
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  kickoffAt: z.string().min(1),
  stadium: z.string().min(2),
  country: z.string().min(2),
  city: z.string().optional(),
  stadiumImageUrl: z.string().optional(),
  upperSeatsTotal: z.number().int().min(1),
  closerSeatsTotal: z.number().int().min(1),
  isFeatured: z.boolean().optional(),
});

export const teamSchema = z.object({
  name: z.string().min(2),
  shortName: z.string().min(2).max(5),
  country: z.string().min(2),
  logoUrl: z.string().optional(),
});

export const settingsSchema = z.object({
  upperSeatPrice: z.number().positive().optional(),
  closerSeatPrice: z.number().positive().optional(),
  maxTicketsPerOrder: z.number().int().min(1).max(2).optional(),
  serviceFeeEnabled: z.boolean().optional(),
  serviceFeePercent: z.number().min(0).max(100).optional(),
  taxEnabled: z.boolean().optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  uniquePaymentEnabled: z.boolean().optional(),
  upperApplePayUrl: z.string().url().optional(),
  upperCashAppUrl: z.string().url().optional(),
  closerApplePayUrl: z.string().url().optional(),
  closerCashAppUrl: z.string().url().optional(),
  siteName: z.string().optional(),
  heroHeadline: z.string().optional(),
  heroSubheadline: z.string().optional(),
  heroImageUrl: z.string().nullable().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  whatsappUrl: z.string().optional(),
  liveChatEnabled: z.boolean().optional(),
  footerText: z.string().optional(),
  faqJson: z.string().optional(),
  privacyPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
});
