import { NextRequest } from "next/server";
import { createResetToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validators";
import { absoluteUrl, errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return errorJson("Valid email required", 400);

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user) {
    return safeJson({
      ok: true,
      message: "If an account exists, a reset link has been prepared.",
    });
  }

  const token = createResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = absoluteUrl(`/account/reset-password?token=${token}`);
  // Demo mode: return token/url in response (no SMTP configured)
  console.log("[Arena Nights] Password reset link:", resetUrl);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const exposeDemoLink =
    process.env.NODE_ENV !== "production" ||
    process.env.DEMO_AUTH_LINKS === "true" ||
    appUrl.includes("localhost") ||
    appUrl.includes("127.0.0.1");

  return safeJson({
    ok: true,
    message: "If an account exists, a reset link has been prepared.",
    demoResetUrl: exposeDemoLink ? resetUrl : undefined,
  });
}
