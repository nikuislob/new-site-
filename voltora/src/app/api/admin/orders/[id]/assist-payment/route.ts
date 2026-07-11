import { NextRequest } from "next/server";
import { requireAdmin, adminCanAssistPayment, logAdminActivity, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { containsSensitiveContent } from "@/lib/support";
import { confirmOrderPayment } from "@/lib/payments/confirm";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const assistPaymentSchema = z.object({
  transactionReference: z.string().min(1).max(120),
  paymentMethodLabel: z.enum([
    "Card POS",
    "Virtual Terminal",
    "MOTO",
    "Apple Pay",
    "Google Pay",
    "Other",
  ]),
  confirmationNote: z.string().max(500).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCanAssistPayment(admin.role)) return errorJson("Forbidden", 403);

    const { id } = await params;
    const existing = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });
    if (!existing) return errorJson("Order not found", 404);

    const body = await req.json();
    const parsed = assistPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const combined = [parsed.data.transactionReference, parsed.data.confirmationNote || ""].join(" ");
    if (containsSensitiveContent(combined)) {
      return errorJson(
        "Do not enter card numbers, CVV codes, or OTPs. Record only the POS/terminal transaction reference.",
        400
      );
    }

    // Duplicate reference check
    const dup = await prisma.adminActivityLog.findFirst({
      where: {
        action: "assist_payment",
        details: { contains: parsed.data.transactionReference },
      },
    });
    if (dup) return errorJson("This transaction reference was already recorded", 409);

    const noteLine = `Assisted payment (${parsed.data.paymentMethodLabel}) ref ${parsed.data.transactionReference}${
      parsed.data.confirmationNote ? ` — ${parsed.data.confirmationNote}` : ""
    }`;

    const order = await confirmOrderPayment({
      orderId: existing.id,
      paymentMethodName: parsed.data.paymentMethodLabel,
      adminNotesAppend: noteLine,
      transactionRef: parsed.data.transactionReference,
    });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    await logAdminActivity(
      admin.id,
      "assist_payment",
      "order",
      order.id,
      JSON.stringify({
        transactionReference: parsed.data.transactionReference,
        paymentMethodLabel: parsed.data.paymentMethodLabel,
        amount: order.total,
      }),
      ip
    );

    return safeJson({ order, message: "Payment confirmed via assisted workflow" });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson(e instanceof Error ? e.message : "Assist payment failed", 400);
  }
}
