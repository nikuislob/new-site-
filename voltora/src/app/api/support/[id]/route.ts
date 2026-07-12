import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { supportMessageSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return errorJson("Conversation not found", 404);
  if (email && conversation.guestEmail && conversation.guestEmail !== email) {
    return errorJson("Unauthorized", 401);
  }
  await prisma.conversation.update({ where: { id }, data: { unreadCustomer: 0 } });
  return safeJson({ conversation });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = supportMessageSchema.safeParse(body);
  if (!parsed.success) return errorJson("Invalid message", 400);
  if (containsSensitiveContent(parsed.data.body)) {
    return errorJson(SENSITIVE_MESSAGE_ERROR, 400);
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) return errorJson("Conversation not found", 404);

  const guestHeader = req.headers.get("x-guest-email")?.toLowerCase();
  if (
    conversation.guestEmail &&
    guestHeader &&
    guestHeader !== conversation.guestEmail
  ) {
    return errorJson("Unauthorized", 401);
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderType: "customer",
      senderName: parsed.data.guestName || conversation.guestName || "Guest",
      body: parsed.data.body.trim(),
    },
  });

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: new Date(),
      unreadAdmin: { increment: 1 },
      status: conversation.status === "CLOSED" ? "OPEN" : conversation.status,
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return safeJson({ message, conversation: updated });
}
