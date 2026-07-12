import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) throw new AuthError("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const conversations = await prisma.conversation.findMany({
      where: status ? { status } : undefined,
      include: {
        user: true,
        assignedTo: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });

    return safeJson({ conversations });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
