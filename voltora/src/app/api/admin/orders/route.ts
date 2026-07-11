import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "orders")) return errorJson("Forbidden", 403);

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const paymentStatus = sp.get("paymentStatus");
    const page = Math.max(1, Number(sp.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 20)));

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (q) {
      where.OR = [
        { orderNumber: { contains: q } },
        { customerEmail: { contains: q } },
        { customerName: { contains: q } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { items: true, paymentMethod: true, user: { select: { id: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return safeJson({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch orders", 500);
  }
}
