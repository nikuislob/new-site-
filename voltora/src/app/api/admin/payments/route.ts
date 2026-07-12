import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";
import { z } from "zod";

const methodSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2),
  name: z.string().min(2),
  iconUrl: z.string().optional().nullable(),
  buttonText: z.string().min(1),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payments")) return errorJson("Forbidden", 403);
    const methods = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } });
    return safeJson({ methods });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "payments")) return errorJson("Forbidden", 403);
    const body = await req.json();
    const methods = z.array(methodSchema).safeParse(body.methods);
    if (!methods.success) return errorJson("Invalid payment methods", 400);

    const updated = [];
    for (const method of methods.data) {
      if (method.id) {
        const row = await prisma.paymentMethod.update({
          where: { id: method.id },
          data: {
            name: method.name,
            iconUrl: method.iconUrl || null,
            buttonText: method.buttonText,
            instructions: method.instructions || null,
            isActive: method.isActive,
            sortOrder: method.sortOrder ?? 0,
          },
        });
        updated.push(row);
      }
    }
    await logAdminActivity(admin.id, "UPDATE_PAYMENT_METHODS", "payment_method");
    return safeJson({ methods: updated });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
