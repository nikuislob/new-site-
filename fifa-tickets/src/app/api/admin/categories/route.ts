import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const categories = await prisma.ticketCategory.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const parsed = categorySchema.partial().safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
    }
    const category = await prisma.ticketCategory.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
