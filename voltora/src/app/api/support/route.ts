import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { supportMessageSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase();
  const conversationId = req.nextUrl.searchParams.get("conversationId");

  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) return errorJson("Conversation not found", 404);
    if (email && conversation.guestEmail && conversation.guestEmail !== email) {
      return errorJson("Unauthorized", 401);
    }
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCustomer: 0 },
    });
    return safeJson({ conversation });
  }

  if (!email) return errorJson("Email required", 400);
  const conversations = await prisma.conversation.findMany({
    where: { guestEmail: email },
    orderBy: { lastMessageAt: "desc" },
    take: 20,
  });
  return safeJson({ conversations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = supportMessageSchema.safeParse(body);
  if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid message", 400);

  if (containsSensitiveContent(parsed.data.body)) {
    return errorJson(SENSITIVE_MESSAGE_ERROR, 400);
  }

  const guestName = parsed.data.guestName?.trim() || "Guest";
  const guestEmail = parsed.data.guestEmail?.trim().toLowerCase() || null;

  if (parsed.data.conversationId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: parsed.data.conversationId },
    });
    if (!existing) return errorJson("Conversation not found", 404);
    if (existing.status === "CLOSED") {
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { status: "OPEN" },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: existing.id,
        senderType: "customer",
        senderName: guestName,
        body: parsed.data.body.trim(),
      },
    });

    const conversation = await prisma.conversation.update({
      where: { id: existing.id },
      data: {
        lastMessageAt: new Date(),
        unreadAdmin: { increment: 1 },
        currentPage: parsed.data.currentPage || existing.currentPage,
        tag: parsed.data.tag || existing.tag,
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return safeJson({ conversationId: conversation.id, message, conversation });
  }

  if (!guestEmail) return errorJson("Email is required to start a chat", 400);

  const conversation = await prisma.conversation.create({
    data: {
      guestName,
      guestEmail,
      orderId: parsed.data.orderId || null,
      subject: parsed.data.subject || "Ticket support",
      tag: parsed.data.tag || null,
      currentPage: parsed.data.currentPage || null,
      unreadAdmin: 1,
      messages: {
        create: {
          senderType: "customer",
          senderName: guestName,
          body: parsed.data.body.trim(),
        },
      },
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return safeJson(
    {
      conversationId: conversation.id,
      message: conversation.messages[0],
      conversation,
    },
    201
  );
}
