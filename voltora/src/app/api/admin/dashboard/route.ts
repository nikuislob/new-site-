import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "dashboard")) return errorJson("Forbidden", 403);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      openTickets,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAYMENT_PENDING" } }),
      prisma.order.aggregate({
        where: { paymentStatus: "CONFIRMED" },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, stockQuantity: { lte: 5 } } }),
      prisma.conversation.count({ where: { status: "OPEN" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { salesCount: "desc" },
        take: 5,
        select: { id: true, name: true, slug: true, salesCount: true, stockQuantity: true },
      }),
    ]);

    const ordersLast30 = await prisma.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return safeJson({
      stats: {
        totalOrders,
        pendingOrders,
        ordersLast30,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProducts,
        lowStockProducts,
        openTickets,
      },
      recentOrders,
      topProducts,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch dashboard", 500);
  }
}
