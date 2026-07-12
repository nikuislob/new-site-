import { adminCan, AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "bookings") && !adminCan(admin.role, "orders:read")) return errorJson("Forbidden", 403);
    const query = new URL(request.url).searchParams;
    const q = query.get("q")?.trim();
    const status = query.get("status");
    const paymentStatus = query.get("paymentStatus");
    const bookings = await prisma.booking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(q ? { OR: [{ reference: { contains: q } }, { customerEmail: { contains: q } }] } : {}),
      },
      include: { match: true, items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 }, deliveries: true },
      orderBy: { createdAt: "desc" },
    });
    return safeJson({ bookings });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to load bookings", 500);
  }
}
