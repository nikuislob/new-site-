import { NextRequest } from "next/server";
import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { errorJson, safeJson } from "@/lib/utils";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        order: true,
        assignedTo: true,
      },
    });
    if (!conversation) return errorJson("Not found", 404);
    await prisma.conversation.update({ where: { id }, data: { unreadAdmin: 0 } });
    return safeJson({ conversation });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const schema = z.object({
      status: z.enum(["OPEN", "CLOSED"]).optional(),
      assignedToId: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid", 400);
    const conversation = await prisma.conversation.update({
      where: { id },
      data: parsed.data,
    });
    return safeJson({ conversation });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const text = String(body.body || "").trim();
    if (!text) return errorJson("Message required", 400);
    if (containsSensitiveContent(text)) return errorJson(SENSITIVE_MESSAGE_ERROR, 400);

    const existing = await prisma.conversation.findUnique({ where: { id } });
    if (!existing) return errorJson("Not found", 404);

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: "admin",
        senderName: admin.name,
        body: text,
      },
    });

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        unreadCustomer: { increment: 1 },
        assignedToId: existing.assignedToId || admin.id,
        status: "OPEN",
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return safeJson({ message, conversation });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
