import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { paymentStatus: status } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q } },
                { customerName: { contains: q } },
                { customerEmail: { contains: q } },
                { customerPhone: { contains: q } },
              ],
            }
          : {}),
      },
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
      orderBy: { createdAt: "desc" },
    });

    return safeJson({ orders });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to load orders", 500);
  }
}
