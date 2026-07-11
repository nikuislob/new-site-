import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  firstName: z.string().min(1, "First name required").max(60),
  lastName: z.string().min(1, "Last name required").max(60),
  phone: z.string().max(20).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const addressSchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().nullable(),
  line1: z.string().min(1).max(120),
  line2: z.string().max(120).optional().nullable(),
  city: z.string().min(1).max(80),
  state: z.string().min(2).max(40),
  zipCode: z.string().min(3).max(20),
  country: z.string().default("United States"),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(20).optional().nullable(),
  shippingLine1: z.string().min(1).max(120),
  shippingLine2: z.string().max(120).optional().nullable(),
  shippingCity: z.string().min(1).max(80),
  shippingState: z.string().min(2).max(40),
  shippingZip: z.string().min(3).max(20),
  shippingCountry: z.string().default("United States"),
  customerNotes: z.string().max(500).optional().nullable(),
  couponCode: z.string().max(40).optional().nullable(),
});

export const productSchema = z.object({
  sku: z.string().min(1).max(60),
  name: z.string().min(1).max(200),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  shortDescription: z.string().min(1).max(500),
  fullDescription: z.string().min(1),
  specifications: z.record(z.string(), z.string()).optional(),
  mainImage: z.string().min(1),
  images: z.array(z.string()).optional(),
  originalPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  stockQuantity: z.number().int().min(0),
  condition: z.enum(["NEW", "OPEN_BOX", "REFURBISHED"]).optional(),
  deliveryEstimate: z.string().max(100).optional(),
  badges: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isActive: z.boolean().optional(),
  relatedIds: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        sku: z.string().min(1),
        color: z.string().optional().nullable(),
        storage: z.string().optional().nullable(),
        priceModifier: z.number().optional(),
        stockQuantity: z.number().int().min(0),
        imageUrl: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .optional(),
});

export const paymentMethodSchema = z.object({
  slot: z.number().int().min(1).max(4),
  name: z.string().min(1).max(80),
  iconUrl: z.string().optional().nullable(),
  paymentUrl: z.string().url().refine((u) => u.startsWith("https://"), {
    message: "Payment URL must use HTTPS",
  }),
  buttonText: z.string().min(1).max(60),
  instructions: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const supportMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  guestName: z.string().max(80).optional(),
  guestEmail: z.string().email().optional(),
  orderId: z.string().optional().nullable(),
  subject: z.string().max(200).optional(),
});

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;
