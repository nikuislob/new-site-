import { adminCan, AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payments")) return errorJson("Forbidden", 403);
    const status = new URL(request.url).searchParams.get("status");
    const payments = await prisma.payment.findMany({
      where: status ? { status } : {},
      include: { booking: { include: { match: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return safeJson({
      payments,
      cashAppConfigured: Boolean(process.env.CASH_APP_API_BASE_URL && process.env.CASH_APP_CREATE_PAYMENT_PATH && process.env.CASH_APP_API_KEY && process.env.CASH_APP_WEBHOOK_SECRET),
    });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to load payments", 500);
  }
}
