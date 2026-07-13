import type { Prisma } from "@prisma/client";
import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders:read")) throw new AuthError("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const paymentStatus = searchParams.get("paymentStatus")?.trim();
    const search = searchParams.get("search")?.trim();
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { guestEmail: { contains: search } },
        { guestName: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: true,
        paymentMethod: true,
        items: { include: { match: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return safeJson({ orders });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
