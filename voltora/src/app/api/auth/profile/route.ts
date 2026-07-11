import { NextRequest } from "next/server";
import { requireCustomer, publicUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  phone: z.string().max(20).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
        ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      },
    });

    return safeJson({ user: publicUser(updated) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update profile", 500);
  }
}
