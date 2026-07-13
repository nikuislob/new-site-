import { publicUser, setCustomerSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Invalid login details.", 422, { issues: parsed.error.issues });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return errorJson("Invalid email or password.", 401);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return errorJson("Invalid email or password.", 401);

  await setCustomerSession(user.id);
  return safeJson({ user: publicUser(user) });
}
