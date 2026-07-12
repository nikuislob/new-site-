import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid contact form", 400, { issues: parsed.error.issues });

    const message = await prisma.contactMessage.create({ data: parsed.data });
    return safeJson({ ok: true, id: message.id }, 201);
  } catch (e) {
    console.error(e);
    return errorJson("Failed to send message", 500);
  }
}
