import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin(["SUPER_ADMIN"]);
    void admin;
    const logs = await prisma.adminActivityLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { name: true, email: true, role: true } } },
    });
    return safeJson({ logs });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
