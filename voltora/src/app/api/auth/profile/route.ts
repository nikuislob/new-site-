import { NextRequest } from "next/server";
import { AuthError, getCurrentCustomer, publicUser, requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentCustomer();
  if (!user) return errorJson("Unauthorized", 401);
  return safeJson({ user: publicUser(user) });
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid profile", 400);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: parsed.data.fullName.trim(),
        phone: parsed.data.phone?.trim() || null,
      },
    });
    return safeJson({ user: publicUser(updated) });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Unable to update profile", 500);
  }
}
