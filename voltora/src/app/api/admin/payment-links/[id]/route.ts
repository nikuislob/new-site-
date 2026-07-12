import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paymentLinkSchema } from "@/lib/validators";
import { errorJson, isValidHttpsUrl, safeJson } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payment_links")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = paymentLinkSchema.partial().safeParse(body);
    if (!parsed.success) return errorJson("Invalid data", 400);
    if (parsed.data.paymentUrl && !isValidHttpsUrl(parsed.data.paymentUrl)) {
      return errorJson("Payment URL must be a valid HTTPS link", 400);
    }

    const link = await prisma.paymentLinkMapping.update({
      where: { id },
      data: parsed.data,
      include: { ticketCategory: true, paymentMethod: true },
    });
    await logAdminActivity(admin.id, "UPDATE_PAYMENT_LINK", "payment_link", id);
    return safeJson({ link });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payment_links")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    await prisma.paymentLinkMapping.delete({ where: { id } });
    await logAdminActivity(admin.id, "DELETE_PAYMENT_LINK", "payment_link", id);
    return safeJson({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
