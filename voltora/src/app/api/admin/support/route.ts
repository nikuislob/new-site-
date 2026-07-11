import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support:read")) return errorJson("Forbidden", 403);

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim();
    const page = Math.max(1, Number(sp.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 20)));

    const where: Prisma.ConversationWhereInput = {};
    if (status === "OPEN" || status === "CLOSED") where.status = status;
    if (q) {
      where.OR = [
        { guestEmail: { contains: q } },
        { guestName: { contains: q } },
        { subject: { contains: q } },
      ];
    }

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          order: { select: { id: true, orderNumber: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { lastMessageAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return safeJson({ conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch conversations", 500);
  }
}
