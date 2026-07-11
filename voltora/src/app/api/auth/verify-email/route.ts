import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("Token required", 400);

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: parsed.data.token,
        emailVerifyExpiry: { gt: new Date() },
      },
    });

    if (!user) return errorJson("Invalid or expired verification token", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });

    return safeJson({ success: true, message: "Email verified successfully" });
  } catch {
    return errorJson("Verification failed", 500);
  }
}
