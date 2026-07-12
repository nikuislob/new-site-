import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableInventory, releaseExpiredReservations } from "@/lib/inventory";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "dashboard")) return errorJson("Forbidden", 403);

    await releaseExpiredReservations();

    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      ticketsSold,
      categories,
      revenueAgg,
      activeChats,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "PAID" } }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT", "AWAITING_VERIFICATION"] } },
      }),
      prisma.ticket.count({ where: { status: { in: ["VALID", "USED"] } } }),
      prisma.ticketCategory.findMany({ where: { isActive: true } }),
      prisma.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalCents: true },
      }),
      prisma.conversation.count({ where: { status: "OPEN" } }),
    ]);

    const remainingInventory = categories.reduce(
      (sum, c) => sum + availableInventory(c.totalInventory, c.reservedCount, c.soldCount),
      0
    );

    const recentOrders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { match: true, items: true },
    });

    return safeJson({
      stats: {
        totalOrders,
        paidOrders,
        pendingOrders,
        ticketsSold,
        remainingInventory,
        revenueCents: revenueAgg._sum.totalCents || 0,
        activeChats,
      },
      recentOrders,
    });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to load dashboard", 500);
  }
}
