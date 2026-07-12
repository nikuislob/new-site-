import { NextRequest } from "next/server";
import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "users") && !adminCan(admin.role, "users:read")) {
      return errorJson("Forbidden", 403);
    }

    const q = req.nextUrl.searchParams.get("q")?.trim();
    const where = q
      ? {
          OR: [
            { email: { contains: q } },
            { fullName: { contains: q } },
          ],
        }
      : undefined;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true } },
        orders: {
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            quantity: true,
            totalCents: true,
            items: {
              select: {
                section: true,
                block: true,
                row: true,
                seatNumber: true,
                categoryName: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    return safeJson({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        orderCount: u._count.orders,
        recentOrders: u.orders,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
