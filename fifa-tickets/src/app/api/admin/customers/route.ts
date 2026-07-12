import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { totalAmount: true, paymentStatus: true },
        },
      },
      take: 500,
    });

    const enriched = customers.map((c) => ({
      id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      paidTotal: c.orders
        .filter((o) => o.paymentStatus === "PAID")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    }));

    return NextResponse.json({ customers: enriched });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
