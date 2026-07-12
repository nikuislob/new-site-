import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";
import { paymentOverrideSchema } from "@/lib/validators";

async function requirePaymentsAdmin() {
  const admin = await requireAdmin();
  if (!adminCan(admin.role, "payments")) throw new AuthError("Forbidden", 403);
  return admin;
}

export async function GET() {
  try {
    await requirePaymentsAdmin();
    const overrides = await prisma.paymentLinkOverride.findMany({
      include: { paymentMethod: true },
      orderBy: [{ amountCents: "asc" }, { createdAt: "asc" }],
    });
    return safeJson({ overrides });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requirePaymentsAdmin();
    const body = await request.json().catch(() => null);
    const parsed = paymentOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid payment override.", 422, { issues: parsed.error.issues });
    }

    const override = await prisma.paymentLinkOverride.upsert({
      where: {
        paymentMethodId_amountCents: {
          paymentMethodId: parsed.data.paymentMethodId,
          amountCents: parsed.data.amountCents,
        },
      },
      create: {
        paymentMethodId: parsed.data.paymentMethodId,
        amountCents: parsed.data.amountCents,
        paymentUrl: parsed.data.paymentUrl,
        isActive: parsed.data.isActive ?? true,
      },
      update: {
        paymentUrl: parsed.data.paymentUrl,
        isActive: parsed.data.isActive ?? true,
      },
      include: { paymentMethod: true },
    });

    await logAdminActivity(admin.id, "UPSERT_PAYMENT_OVERRIDE", "PaymentLinkOverride", override.id);
    return safeJson({ override });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
