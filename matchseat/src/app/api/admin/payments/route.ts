import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";
import { paymentMethodSchema } from "@/lib/validators";

const updateSchema = paymentMethodSchema.partial().extend({
  id: z.string().min(1),
});

async function requirePaymentsAdmin() {
  const admin = await requireAdmin();
  if (!adminCan(admin.role, "payments")) throw new AuthError("Forbidden", 403);
  return admin;
}

export async function GET() {
  try {
    await requirePaymentsAdmin();
    const paymentMethods = await prisma.paymentMethod.findMany({
      include: { overrides: { orderBy: { amountCents: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return safeJson({ paymentMethods });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requirePaymentsAdmin();
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid payment method.", 422, { issues: parsed.error.issues });
    }

    const data: Prisma.PaymentMethodUpdateInput = {};
    if (parsed.data.code !== undefined) data.code = parsed.data.code.trim().toUpperCase();
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.urlTemplate !== undefined) data.urlTemplate = parsed.data.urlTemplate.trim();
    if (parsed.data.buttonText !== undefined) data.buttonText = parsed.data.buttonText.trim();
    if (parsed.data.instructions !== undefined) data.instructions = parsed.data.instructions;
    if (parsed.data.iconUrl !== undefined) data.iconUrl = parsed.data.iconUrl;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder;

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: parsed.data.id },
      data,
      include: { overrides: { orderBy: { amountCents: "asc" } } },
    });

    await logAdminActivity(admin.id, "UPDATE_PAYMENT_METHOD", "PaymentMethod", paymentMethod.id, paymentMethod.code);
    return safeJson({ paymentMethod });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
