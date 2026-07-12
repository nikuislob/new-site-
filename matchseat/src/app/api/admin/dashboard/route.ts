import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "dashboard")) throw new AuthError("Forbidden", 403);

    const [matches, pendingOrders, confirmedRevenue, openChats] = await Promise.all([
      prisma.match.count(),
      prisma.order.count({ where: { status: "PAYMENT_PENDING" } }),
      prisma.order.aggregate({
        where: { status: "PAYMENT_CONFIRMED" },
        _sum: { totalCents: true },
      }),
      prisma.conversation.count({ where: { status: "OPEN" } }),
    ]);

    return safeJson({
      counts: {
        matches,
        pendingOrders,
        confirmedRevenueCents: confirmedRevenue._sum.totalCents ?? 0,
        openChats,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
