import { z } from "zod";
import { reserveInventory } from "@/lib/tickets";
import { errorJson, safeJson } from "@/lib/utils";

const schema = z.object({
  listingId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid selection", 400);
    const { reservation, listing } = await reserveInventory(parsed.data.listingId, parsed.data.quantity);
    return safeJson({
      reservation: {
        token: reservation.token,
        expiresAt: reservation.expiresAt,
        quantity: reservation.quantity,
      },
      listing: { id: listing.id, category: listing.category, section: listing.section },
    }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Unable to reserve tickets", 409);
  }
}
