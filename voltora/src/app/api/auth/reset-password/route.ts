import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message || "Invalid reset data", 400);
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: parsed.data.token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) return errorJson("Reset link is invalid or expired", 400);

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return safeJson({ ok: true, message: "Password updated. You can sign in now." });
}
