import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ inquiries });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
    const inquiry = await prisma.contactInquiry.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ inquiry });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
