import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";
import { paymentLinkSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const links = await prisma.paymentLink.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ links });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = await req.json();
    const { key, ...rest } = body;
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
    const parsed = paymentLinkSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment link data" }, { status: 400 });
    }
    const link = await prisma.paymentLink.update({
      where: { key },
      data: {
        url: parsed.data.url,
        isActive: parsed.data.isActive ?? true,
      },
    });
    return NextResponse.json({ link });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
