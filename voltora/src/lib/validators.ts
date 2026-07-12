import { z } from "zod";

export const checkoutSchema = z.object({
  matchId: z.string().uuid(),
  customerEmail: z.string().email(),
  customerName: z.string().min(2).max(120).optional(),
  ticketType: z.enum(["standard", "premium"]),
  quantity: z.number().int().min(1),
});

export const matchCreateSchema = z.object({
  homeTeam: z.string().min(2).max(80),
  awayTeam: z.string().min(2).max(80),
  venue: z.string().min(2).max(160),
  stadiumViewUrl: z.string().url(),
  matchDate: z.string().datetime({ offset: true }).or(z.string().min(8)),
  standardAvailable: z.number().int().min(0).max(100000),
  premiumAvailable: z.number().int().min(0).max(100000),
});

export const paymentLinkSchema = z.object({
  paymentLink: z.string().url(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
