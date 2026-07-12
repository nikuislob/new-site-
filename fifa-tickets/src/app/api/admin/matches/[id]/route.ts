import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";
import { matchSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminFromRequest(req);
    const { id } = await ctx.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        seats: { include: { category: true }, orderBy: [{ section: "asc" }, { row: "asc" }, { number: "asc" }] },
        orders: { take: 20, orderBy: { createdAt: "desc" }, include: { customer: true } },
      },
    });
    if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminFromRequest(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const match = await prisma.match.update({
      where: { id },
      data: {
        homeTeam: data.homeTeam,
        opponent: data.opponent,
        venue: data.venue,
        stadiumName: data.stadiumName,
        stadiumImage: data.stadiumImage || null,
        matchDate: new Date(data.matchDate),
        matchTime: data.matchTime,
        description: data.description || null,
        isPublished: data.isPublished ?? true,
      },
    });
    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: "Unauthorized or update failed" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdminFromRequest(req);
    const { id } = await ctx.params;
    await prisma.orderItem.deleteMany({ where: { order: { matchId: id } } });
    await prisma.order.deleteMany({ where: { matchId: id } });
    await prisma.seat.deleteMany({ where: { matchId: id } });
    await prisma.match.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized or delete failed" }, { status: 401 });
  }
}
