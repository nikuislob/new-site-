import { adminCan, AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "dashboard")) return errorJson("Forbidden", 403);
    const now = new Date();
    const [upcomingMatches, activeListings, openSupport, pendingOrders, paidOrders, recentBookings] = await Promise.all([
      prisma.eventMatch.count({ where: { kickoffAt: { gt: now }, isVisible: true, status: { in: ["SCHEDULED", "TIMED", "POSTPONED"] } } }),
      prisma.ticketListing.count({ where: { isActive: true, quantityAvailable: { gt: 0 } } }),
      prisma.conversation.count({ where: { status: "OPEN" } }),
      prisma.booking.count({ where: { paymentStatus: { not: "PAID" }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
      prisma.booking.aggregate({ where: { paymentStatus: "PAID" }, _count: true, _sum: { total: true } }),
      prisma.booking.findMany({ include: { match: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    ]);
    return safeJson({
      stats: {
        upcomingMatches,
        activeListings,
        openSupport,
        pendingOrders,
        paidOrders: paidOrders._count,
        revenue: paidOrders._sum.total || 0,
      },
      recentBookings,
    });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to load dashboard", 500);
  }
}
