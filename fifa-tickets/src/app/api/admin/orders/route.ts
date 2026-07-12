import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const status = req.nextUrl.searchParams.get("status");
    const orders = await prisma.order.findMany({
      where: status ? { paymentStatus: status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        match: true,
        customer: true,
        category: true,
        items: { include: { seat: true } },
      },
      take: 200,
    });
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const body = await req.json();
    const { id, paymentStatus, status } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(status ? { status } : {}),
      },
    });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
