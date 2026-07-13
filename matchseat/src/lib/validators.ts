import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const checkoutSchema = z.object({
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  billingCity: z.string().min(2).max(80),
  billingState: z.string().min(2).max(40),
  billingZip: z.string().min(3).max(12),
  paymentMethodId: z.string().min(1),
  items: z
    .array(
      z.object({
        matchId: z.string().min(1),
        seatTier: z.enum(["BASIC", "PREMIUM"]),
        quantity: z.number().int().min(1).max(2),
      })
    )
    .min(1),
});

export const paymentMethodSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(80),
  urlTemplate: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://"), { message: "URL must use HTTPS" }),
  buttonText: z.string().min(1).max(80).optional(),
  instructions: z.string().max(2000).optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const paymentOverrideSchema = z.object({
  paymentMethodId: z.string().min(1),
  amountCents: z.number().int().positive(),
  paymentUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://"), { message: "URL must use HTTPS" }),
  isActive: z.boolean().optional(),
});

export const matchSchema = z.object({
  homeTeam: z.string().min(2),
  awayTeam: z.string().min(2),
  homeFlag: z.string().optional().nullable(),
  awayFlag: z.string().optional().nullable(),
  stage: z.string().min(2),
  groupName: z.string().optional().nullable(),
  kickoffAt: z.string().min(1),
  venueName: z.string().min(2),
  venueCity: z.string().min(2),
  venueState: z.string().min(2),
  venueCapacity: z.number().int().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  basicStock: z.number().int().min(0).optional(),
  premiumStock: z.number().int().min(0).optional(),
});
