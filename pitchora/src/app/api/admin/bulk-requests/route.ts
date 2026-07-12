import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const requests = await prisma.bulkRequest.findMany({
      include: { match: { include: { homeTeam: true, awayTeam: true } } },
      orderBy: { createdAt: "desc" },
    });
    return safeJson({ requests });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to load bulk requests", 500);
  }
}
