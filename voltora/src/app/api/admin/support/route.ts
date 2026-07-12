import { NextRequest } from "next/server";
import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { guestName: { contains: q } },
        { guestEmail: { contains: q } },
        { subject: { contains: q } },
        { tag: { contains: q } },
      ];
    }
    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true } },
        order: { select: { orderNumber: true } },
        _count: { select: { messages: true } },
      },
      take: 100,
    });
    return safeJson({ conversations });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
