import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { errorJson, safeJson } from "@/lib/utils";

const supportMessageSchema = z.object({
  conversationId: z.string().min(1).optional(),
  guestName: z.string().min(2).max(100).optional(),
  guestEmail: z.string().email().optional(),
  body: z.string().min(1).max(4000),
});

async function canAccessConversation(conversationId: string, guestEmail?: string | null) {
  const customer = await getCurrentCustomer();
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) return { conversation: null, allowed: false };
  const ownsConversation = Boolean(customer && conversation.userId === customer.id);
  const guestMatches = Boolean(
    guestEmail && conversation.guestEmail?.toLowerCase() === guestEmail.toLowerCase()
  );

  return { conversation, allowed: ownsConversation || guestMatches };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return errorJson("conversationId is required.", 400);

  const { conversation, allowed } = await canAccessConversation(
    conversationId,
    searchParams.get("guestEmail")
  );
  if (!conversation) return errorJson("Conversation not found.", 404);
  if (!allowed) return errorJson("Forbidden", 403);

  return safeJson({ conversation, messages: conversation.messages });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = supportMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Invalid support message.", 422, { issues: parsed.error.issues });
  }

  if (containsSensitiveContent(parsed.data.body)) {
    return errorJson(SENSITIVE_MESSAGE_ERROR, 400);
  }

  const customer = await getCurrentCustomer();
  const guestEmail = parsed.data.guestEmail?.toLowerCase().trim();
  const senderName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : parsed.data.guestName?.trim();

  if (!customer && (!senderName || !guestEmail)) {
    return errorJson("Guest name and email are required.", 422);
  }

  if (parsed.data.conversationId) {
    const { conversation, allowed } = await canAccessConversation(parsed.data.conversationId, guestEmail);
    if (!conversation) return errorJson("Conversation not found.", 404);
    if (!allowed) return errorJson("Forbidden", 403);

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        senderName,
        body: parsed.data.body.trim(),
      },
    });
    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: conversation.status === "CLOSED" ? "OPEN" : conversation.status },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    return safeJson({ conversation: updated, message });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: customer?.id,
      guestName: customer ? `${customer.firstName} ${customer.lastName}` : senderName,
      guestEmail: customer ? customer.email : guestEmail,
      status: "OPEN",
      lastMessageAt: new Date(),
      messages: {
        create: {
          senderType: "CUSTOMER",
          senderName,
          body: parsed.data.body.trim(),
        },
      },
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return safeJson({ conversation, message: conversation.messages[0] }, 201);
}
