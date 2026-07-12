import { prisma } from "@/lib/db";
import { bulkRequestSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bulkRequestSchema.safeParse({
      ...body,
      quantity: Number(body.quantity),
    });
    if (!parsed.success) return errorJson("Invalid bulk request", 400, { issues: parsed.error.issues });

    const data = parsed.data;
    if (data.matchId) {
      const match = await prisma.match.findUnique({ where: { id: data.matchId } });
      if (!match) return errorJson("Match not found", 404);
    }

    const request = await prisma.bulkRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        matchId: data.matchId || null,
        matchLabel: data.matchLabel || null,
        quantity: data.quantity,
        message: data.message || null,
      },
    });

    return safeJson({ ok: true, id: request.id }, 201);
  } catch (e) {
    console.error(e);
    return errorJson("Failed to submit bulk request", 500);
  }
}
