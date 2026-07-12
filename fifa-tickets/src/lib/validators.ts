import { z } from "zod";

export const checkoutSchema = z.object({
  matchId: z.string().min(1),
  categoryId: z.string().min(1),
  seatIds: z.array(z.string().min(1)).min(1).max(2),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  matchId: z.string().optional().nullable(),
  quantity: z.number().int().min(3).max(100).optional().nullable(),
  message: z.string().min(5).max(2000),
});

export const matchSchema = z.object({
  homeTeam: z.string().min(1).max(80).default("FIFA Select"),
  opponent: z.string().min(1).max(80),
  venue: z.string().min(1).max(120),
  stadiumName: z.string().min(1).max(120),
  stadiumImage: z.string().optional().nullable(),
  matchDate: z.string().min(1),
  matchTime: z.string().min(1).max(20),
  description: z.string().max(2000).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const categorySchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive(),
  color: z.string().min(1).max(20),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const paymentLinkSchema = z.object({
  url: z.string().url(),
  isActive: z.boolean().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const seatUpdateSchema = z.object({
  seatIds: z.array(z.string()).min(1),
  status: z.enum(["AVAILABLE", "HELD", "SOLD"]),
});
