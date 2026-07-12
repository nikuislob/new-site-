import { z } from "zod";
import { adminCan, AuthError, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

const schema = z.object({
  id: z.string().optional(),
  matchId: z.string().min(1),
  category: z.string().min(2),
  section: z.string().min(1),
  row: z.string().optional().nullable(),
  exactSeats: z.string().optional().nullable(),
  quantityTotal: z.number().int().min(1),
  quantityAvailable: z.number().int().min(0),
  price: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  ticketType: z.string().min(2),
  deliveryMethod: z.string().min(2),
  notes: z.string().optional().nullable(),
  restrictions: z.string().optional().nullable(),
  seatsTogether: z.boolean(),
  allowedQuantities: z.string().default("[]"),
  mapZone: z.enum(["SIDELINE", "CORNER", "UPPER", "CLUB"]),
  isActive: z.boolean(),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "tickets")) return errorJson("Forbidden", 403);
    const [listings, matches] = await Promise.all([
      prisma.ticketListing.findMany({ include: { match: true }, orderBy: { createdAt: "desc" } }),
      prisma.eventMatch.findMany({ orderBy: { kickoffAt: "asc" } }),
    ]);
    return safeJson({ listings, matches });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to load ticket inventory", 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "tickets")) return errorJson("Forbidden", 403);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid listing", 400);
    const { id, ...input } = parsed.data;
    if (input.quantityAvailable > input.quantityTotal) return errorJson("Available quantity cannot exceed total", 400);
    const listing = id
      ? await prisma.ticketListing.update({ where: { id }, data: input })
      : await prisma.ticketListing.create({ data: input });
    await logAdminActivity(admin.id, id ? "TICKET_LISTING_UPDATED" : "TICKET_LISTING_CREATED", "TicketListing", listing.id);
    return safeJson({ listing }, id ? 200 : 201);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to save ticket listing", 500);
  }
}
