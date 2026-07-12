import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paymentLinkSchema } from "@/lib/validators";
import { errorJson, isValidHttpsUrl, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payment_links") && !adminCan(admin.role, "payments")) {
      return errorJson("Forbidden", 403);
    }
    const links = await prisma.paymentLinkMapping.findMany({
      include: {
        ticketCategory: { include: { match: true } },
        paymentMethod: true,
      },
      orderBy: [{ ticketCategoryId: "asc" }, { quantity: "asc" }],
    });
    return safeJson({ links });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payment_links")) return errorJson("Forbidden", 403);
    const body = await req.json();
    const parsed = paymentLinkSchema.safeParse(body);
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid", 400);
    if (!isValidHttpsUrl(parsed.data.paymentUrl)) {
      return errorJson("Payment URL must be a valid HTTPS link", 400);
    }

    const link = await prisma.paymentLinkMapping.create({
      data: {
        ticketCategoryId: parsed.data.ticketCategoryId,
        quantity: parsed.data.quantity,
        paymentMethodId: parsed.data.paymentMethodId,
        paymentUrl: parsed.data.paymentUrl,
        expectedAmountCents: parsed.data.expectedAmountCents,
        isActive: parsed.data.isActive ?? true,
      },
      include: { ticketCategory: true, paymentMethod: true },
    });
    await logAdminActivity(admin.id, "CREATE_PAYMENT_LINK", "payment_link", link.id);
    return safeJson({ link }, 201);
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to create payment link", 500);
  }
}
