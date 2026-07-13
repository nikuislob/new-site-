import { z } from "zod";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { errorJson, safeJson } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const replySchema = z.object({
  body: z.string().min(1).max(4000),
});

const patchSchema = z.object({
  status: z.enum(["OPEN", "PENDING", "CLOSED"]).optional(),
  assignedToId: z.string().min(1).nullable().optional(),
});

async function requireSupportAdmin() {
  const admin = await requireAdmin();
  if (!adminCan(admin.role, "support")) throw new AuthError("Forbidden", 403);
  return admin;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSupportAdmin();
    const { id } = await context.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: true,
        assignedTo: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) return errorJson("Conversation not found.", 404);
    return safeJson({ conversation, messages: conversation.messages });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireSupportAdmin();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid support reply.", 422, { issues: parsed.error.issues });
    }
    if (containsSensitiveContent(parsed.data.body)) {
      return errorJson(SENSITIVE_MESSAGE_ERROR, 400);
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return errorJson("Conversation not found.", 404);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: "AGENT",
        senderName: admin.name,
        body: parsed.data.body.trim(),
      },
    });
    const updated = await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date(), status: "PENDING", assignedToId: conversation.assignedToId ?? admin.id },
      include: {
        user: true,
        assignedTo: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    await logAdminActivity(admin.id, "REPLY_SUPPORT", "Conversation", id);
    return safeJson({ conversation: updated, message });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireSupportAdmin();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson("Invalid support update.", 422, { issues: parsed.error.issues });
    }

    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) return errorJson("Conversation not found.", 404);

    if (parsed.data.assignedToId) {
      const assignee = await prisma.adminUser.findUnique({ where: { id: parsed.data.assignedToId } });
      if (!assignee || !assignee.isActive) return errorJson("Assigned agent not found.", 422);
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.assignedToId !== undefined ? { assignedToId: parsed.data.assignedToId } : {}),
      },
      include: {
        user: true,
        assignedTo: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    await logAdminActivity(admin.id, "UPDATE_SUPPORT", "Conversation", id);
    return safeJson({ conversation });
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
