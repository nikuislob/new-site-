import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { expirePastMatches, upcomingMatchWhere } from "@/lib/matches";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await expirePastMatches();

    const [totalOrders, paidOrders, upcomingMatches, bulkPending, pendingOrders, revenueAgg] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.findMany({ where: { paymentStatus: "PAID" }, select: { paymentAmount: true } }),
        prisma.match.count({ where: upcomingMatchWhere() }),
        prisma.bulkRequest.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { paymentStatus: "PENDING" } }),
        prisma.order.aggregate({
          where: { paymentStatus: "PAID" },
          _sum: { paymentAmount: true },
        }),
      ]);

    const upcoming = await prisma.match.findMany({
      where: upcomingMatchWhere(),
      include: { homeTeam: true, awayTeam: true },
      orderBy: { kickoffAt: "asc" },
      take: 5,
    });

    const seatAvailability = upcoming.map((m) => ({
      id: m.id,
      label: `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`,
      upperAvailable: Math.max(0, m.upperSeatsTotal - m.upperSeatsSold),
      closerAvailable: Math.max(0, m.closerSeatsTotal - m.closerSeatsSold),
    }));

    return safeJson({
      stats: {
        totalOrders,
        revenue: revenueAgg._sum.paymentAmount || 0,
        paidOrders: paidOrders.length,
        upcomingMatches,
        bulkPending,
        pendingOrders,
      },
      seatAvailability,
      recentOrders: await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { match: { include: { homeTeam: true, awayTeam: true } } },
      }),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    console.error(e);
    return errorJson("Failed to load dashboard", 500);
  }
}
