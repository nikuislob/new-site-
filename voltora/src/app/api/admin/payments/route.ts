import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paymentMethodSchema } from "@/lib/validators";
import { safeJson, errorJson } from "@/lib/utils";

const VALID_SLOTS = [1, 2, 3, 4] as const;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payments")) return errorJson("Forbidden", 403);

    const methods = await prisma.paymentMethod.findMany({ orderBy: { slot: "asc" } });

    const slots = VALID_SLOTS.map((slot) => {
      const method = methods.find((m) => m.slot === slot);
      return method || { slot, name: "", paymentUrl: "", buttonText: "Pay Now", isActive: false, iconUrl: null, instructions: null };
    });

    return safeJson({ paymentMethods: slots });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch payment methods", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payments")) return errorJson("Forbidden", 403);

    const body = await req.json();
    const parsed = paymentMethodSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    if (!VALID_SLOTS.includes(parsed.data.slot as 1 | 2 | 3 | 4)) {
      return errorJson("Slot must be between 1 and 4", 400);
    }

    const method = await prisma.paymentMethod.upsert({
      where: { slot: parsed.data.slot },
      create: {
        slot: parsed.data.slot,
        name: parsed.data.name,
        iconUrl: parsed.data.iconUrl || null,
        paymentUrl: parsed.data.paymentUrl,
        buttonText: parsed.data.buttonText,
        instructions: parsed.data.instructions || null,
        isActive: parsed.data.isActive ?? true,
      },
      update: {
        name: parsed.data.name,
        iconUrl: parsed.data.iconUrl || null,
        paymentUrl: parsed.data.paymentUrl,
        buttonText: parsed.data.buttonText,
        instructions: parsed.data.instructions || null,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return safeJson({ paymentMethod: method });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update payment method", 500);
  }
}
