import { hashPassword, publicUser, setCustomerSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Invalid registration details.", 422, { issues: parsed.error.issues });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return errorJson("An account already exists for this email.", 409);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone?.trim() || null,
    },
  }).catch((error: { code?: string }) => {
    if (error?.code === "P2002") return null;
    throw error;
  });
  if (!user) return errorJson("An account already exists for this email.", 409);

  await setCustomerSession(user.id);
  return safeJson({ user: publicUser(user) }, 201);
}
