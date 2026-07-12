import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";
import { matchSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: "asc" },
      include: {
        _count: { select: { seats: true, orders: true } },
      },
    });
    return NextResponse.json({ matches });
  } catch {
    return unauthorized();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = await req.json();
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid match data", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    let slug = slugify(`${data.homeTeam}-vs-${data.opponent}-${data.stadiumName}`);
    const existing = await prisma.match.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const match = await prisma.match.create({
      data: {
        slug,
        homeTeam: data.homeTeam,
        opponent: data.opponent,
        venue: data.venue,
        stadiumName: data.stadiumName,
        stadiumImage: data.stadiumImage || "/images/stadium-metlife.svg",
        matchDate: new Date(data.matchDate),
        matchTime: data.matchTime,
        description: data.description || null,
        isPublished: data.isPublished ?? true,
      },
    });

    // Generate default seat inventory if categories exist
    const categories = await prisma.ticketCategory.findMany({ where: { isActive: true } });
    const basic = categories.find((c) => c.code === "BASIC");
    const premium = categories.find((c) => c.code === "PREMIUM");
    const seats: {
      matchId: string;
      categoryId: string;
      section: string;
      row: string;
      number: number;
      label: string;
      status: string;
    }[] = [];

    if (premium) {
      for (const section of ["P1", "P2"]) {
        for (const row of ["A", "B", "C"]) {
          for (let n = 1; n <= 8; n++) {
            seats.push({
              matchId: match.id,
              categoryId: premium.id,
              section,
              row,
              number: n,
              label: `${section}-${row}${n}`,
              status: "AVAILABLE",
            });
          }
        }
      }
    }
    if (basic) {
      for (const section of ["B1", "B2", "B3", "B4"]) {
        for (const row of ["D", "E", "F", "G", "H"]) {
          for (let n = 1; n <= 10; n++) {
            seats.push({
              matchId: match.id,
              categoryId: basic.id,
              section,
              row,
              number: n,
              label: `${section}-${row}${n}`,
              status: "AVAILABLE",
            });
          }
        }
      }
    }
    if (seats.length) await prisma.seat.createMany({ data: seats });

    return NextResponse.json({ match, seatsCreated: seats.length });
  } catch {
    return unauthorized();
  }
}
