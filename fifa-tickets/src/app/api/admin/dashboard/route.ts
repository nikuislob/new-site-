import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);

    const [matches, orders, customers, inquiries, seatsAvailable, seatsSold, revenueAgg] =
      await Promise.all([
        prisma.match.count(),
        prisma.order.count(),
        prisma.customer.count(),
        prisma.contactInquiry.count({ where: { status: "NEW" } }),
        prisma.seat.count({ where: { status: "AVAILABLE" } }),
        prisma.seat.count({ where: { status: "SOLD" } }),
        prisma.order.aggregate({
          where: { paymentStatus: "PAID" },
          _sum: { totalAmount: true },
        }),
      ]);

    const recentOrders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { customer: true, match: true, category: true },
    });

    return NextResponse.json({
      stats: {
        matches,
        orders,
        customers,
        inquiries,
        seatsAvailable,
        seatsSold,
        revenue: revenueAgg._sum.totalAmount || 0,
      },
      recentOrders,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
