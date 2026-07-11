import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  assignedToId: z.string().optional().nullable(),
});

const replySchema = z.object({ body: z.string().min(1).max(2000) });

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    if (!conversation) return errorJson("Conversation not found", 404);

    await prisma.conversation.update({
      where: { id },
      data: { unreadAdmin: 0 },
    });

    return safeJson({ conversation });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch conversation", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: parsed.data,
      include: { assignedTo: { select: { id: true, name: true } } },
    });

    return safeJson({ conversation });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update conversation", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) return errorJson("Conversation not found", 404);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: "admin",
        senderName: admin.name,
        body: parsed.data.body,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        unreadCustomer: { increment: 1 },
        assignedToId: conversation.assignedToId || admin.id,
      },
    });

    return safeJson({ message }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to send reply", 500);
  }
}
