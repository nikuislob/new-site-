import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        matchId: data.matchId || null,
        quantity: data.quantity || null,
        message: data.message,
        status: "NEW",
      },
    });

    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (err) {
    console.error("contact error", err);
    return NextResponse.json({ error: "Could not submit inquiry" }, { status: 500 });
  }
}
