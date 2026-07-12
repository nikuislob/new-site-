import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";
import { seatUpdateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const matchId = req.nextUrl.searchParams.get("matchId");
    if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });
    const seats = await prisma.seat.findMany({
      where: { matchId },
      include: { category: true },
      orderBy: [{ section: "asc" }, { row: "asc" }, { number: "asc" }],
    });
    return NextResponse.json({ seats });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = await req.json();
    const parsed = seatUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid seat update" }, { status: 400 });
    }
    await prisma.seat.updateMany({
      where: { id: { in: parsed.data.seatIds } },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, updated: parsed.data.seatIds.length });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
