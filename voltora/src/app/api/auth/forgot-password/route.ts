import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("Valid email required", 400);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

    if (user) {
      const resetToken = nanoid(32);
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry: resetExpiry },
      });
      console.log(`[Voltora Demo] Password reset token for ${user.email}: ${resetToken}`);
    }

    return safeJson({ success: true, message: "If an account exists, a reset link has been sent." });
  } catch {
    return errorJson("Request failed", 500);
  }
}
