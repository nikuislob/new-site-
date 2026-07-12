import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30).optional().nullable().or(z.literal("")),
});

export const matchSchema = z.object({
  title: z.string().min(2).max(120),
  teamAName: z.string().min(1).max(80),
  teamBName: z.string().min(1).max(80),
  teamACode: z.string().min(2).max(6),
  teamBCode: z.string().min(2).max(6),
  teamAFlagUrl: z.string().url().optional().nullable().or(z.literal("")),
  teamBFlagUrl: z.string().url().optional().nullable().or(z.literal("")),
  matchDate: z.string().datetime({ offset: true }).or(z.string().min(1)),
  stadiumName: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  description: z.string().max(2000).optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  salesEnabled: z.boolean().optional(),
  isSoldOut: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const ticketCategorySchema = z.object({
  matchId: z.string().min(1),
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().min(2).max(500),
  priceCents: z.number().int().positive(),
  totalInventory: z.number().int().min(0),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const stadiumZoneSchema = z.object({
  matchId: z.string().min(1),
  categoryId: z.string().min(1),
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  viewingQuality: z.enum(["STANDARD", "GOOD", "PREMIUM"]).optional(),
  svgPathId: z.string().min(1).max(80),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const paymentLinkSchema = z.object({
  ticketCategoryId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  paymentMethodId: z.string().min(1),
  paymentUrl: z.string().url(),
  expectedAmountCents: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  matchId: z.string().min(1),
  seatIds: z.array(z.string().min(1)).min(1).max(2),
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(30).optional().nullable(),
  paymentMethodCode: z.enum(["APPLE_PAY", "CASH_APP"]),
});

export const findTicketSchema = z.object({
  orderNumber: z.string().min(4),
  accessCode: z.string().min(6),
  email: z.string().email().optional(),
});

export const supportMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  conversationId: z.string().optional().nullable(),
  guestName: z.string().min(1).max(120).optional().nullable(),
  guestEmail: z.string().email().optional().nullable(),
  orderId: z.string().optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  tag: z.string().max(60).optional().nullable(),
  currentPage: z.string().max(200).optional().nullable(),
});

export const orderStatusUpdateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "AWAITING_PAYMENT",
      "AWAITING_VERIFICATION",
      "PAID",
      "TICKET_ISSUED",
      "CANCELLED",
      "REFUNDED",
    ])
    .optional(),
  paymentStatus: z.enum(["PENDING", "AWAITING_VERIFICATION", "PAID", "FAILED", "REFUNDED"]).optional(),
  adminNotes: z.string().max(2000).optional().nullable(),
  verifyPayment: z.boolean().optional(),
  cancelOrder: z.boolean().optional(),
  reissueTickets: z.boolean().optional(),
  revokeTickets: z.boolean().optional(),
});

export const siteSettingsSchema = z.record(z.string(), z.string());

export const qrScanSchema = z.object({
  token: z.string().min(10),
  action: z.enum(["validate", "checkin"]).default("validate"),
});
