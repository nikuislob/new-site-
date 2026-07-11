import { NextRequest } from "next/server";
import { requireCustomer, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validators";
import { safeJson, errorJson } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireCustomer();
    const { id } = await params;
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return errorJson("Address not found", 404);

    const body = await req.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: parsed.data,
    });

    return safeJson({ address });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update address", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireCustomer();
    const { id } = await params;
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return errorJson("Address not found", 404);

    await prisma.address.delete({ where: { id } });
    return safeJson({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to delete address", 500);
  }
}
