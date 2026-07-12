import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSeatHold, HoldError, releaseExpiredHolds } from "@/lib/seats";
import { errorJson, safeJson } from "@/lib/utils";

const holdSchema = z.object({
  matchId: z.string().min(1),
  seatIds: z.array(z.string()).min(1).max(2),
  holdToken: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = holdSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid hold request", 400, { issues: parsed.error.issues });

    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) return errorJson("Settings missing", 500);
    if (parsed.data.seatIds.length > settings.maxTicketsPerOrder) {
      return errorJson("For bookings of 3 or more tickets, please contact our support team.", 400);
    }

    const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId } });
    if (!match) return errorJson("Match not found", 404);
    if (match.kickoffAt <= new Date()) return errorJson("Match expired", 410);

    await releaseExpiredHolds(parsed.data.matchId);

    const hold = await createSeatHold({
      matchId: parsed.data.matchId,
      seatIds: parsed.data.seatIds,
      holdToken: parsed.data.holdToken,
    });

    return safeJson({ hold }, 201);
  } catch (e) {
    if (e instanceof HoldError) return errorJson(e.message, e.status);
    console.error(e);
    return errorJson("Failed to hold seats", 500);
  }
}
