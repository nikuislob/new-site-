import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const replySchema = z.object({ body: z.string().min(1).max(2000) });

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getCurrentCustomer();
    const guestEmail = req.nextUrl.searchParams.get("email")?.toLowerCase();

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        ...(user ? { userId: user.id } : guestEmail ? { guestEmail } : { id: "__none__" }),
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    if (!conversation) return errorJson("Conversation not found", 404);

    if (user) {
      await prisma.conversation.update({
        where: { id },
        data: { unreadCustomer: 0 },
      });
    }

    return safeJson({ conversation });
  } catch {
    return errorJson("Failed to fetch conversation", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getCurrentCustomer();
    const guestEmail = req.headers.get("x-guest-email")?.toLowerCase();

    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    if (containsSensitiveContent(parsed.data.body)) {
      return errorJson(SENSITIVE_MESSAGE_ERROR, 400);
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        ...(user ? { userId: user.id } : guestEmail ? { guestEmail } : { id: "__none__" }),
      },
    });

    if (!conversation) return errorJson("Conversation not found", 404);
    if (conversation.status === "CLOSED") return errorJson("Conversation is closed", 400);

    const senderName = user
      ? `${user.firstName} ${user.lastName}`
      : conversation.guestName || "Guest";

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: "customer",
        senderName,
        body: parsed.data.body,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date(), unreadAdmin: { increment: 1 } },
    });

    return safeJson({ message }, 201);
  } catch {
    return errorJson("Failed to send reply", 500);
  }
}
