import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const format = req.nextUrl.searchParams.get("format") || "json";

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        match: true,
        customer: true,
        category: true,
        items: { include: { seat: true } },
      },
    });

    const summary = {
      totalOrders: orders.length,
      paidOrders: orders.filter((o) => o.paymentStatus === "PAID").length,
      pendingOrders: orders.filter((o) => o.paymentStatus === "PENDING").length,
      revenue: orders
        .filter((o) => o.paymentStatus === "PAID")
        .reduce((sum, o) => sum + o.totalAmount, 0),
      ticketsSold: orders
        .filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "PENDING")
        .reduce((sum, o) => sum + o.quantity, 0),
    };

    if (format === "csv") {
      const header = [
        "OrderNumber",
        "Date",
        "Customer",
        "Email",
        "Match",
        "Category",
        "Qty",
        "Total",
        "PaymentStatus",
        "Seats",
      ];
      const rows = orders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString(),
        `${o.customer.firstName} ${o.customer.lastName}`,
        o.customer.email,
        `${o.match.homeTeam} vs ${o.match.opponent}`,
        o.category.name,
        String(o.quantity),
        String(o.totalAmount),
        o.paymentStatus,
        o.items.map((i) => i.seat.label).join("|"),
      ]);
      const csv = [header, ...rows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fifa-sales-report.csv"`,
        },
      });
    }

    return NextResponse.json({ summary, orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
