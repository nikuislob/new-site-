import { NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { supportMessageSchema } from "@/lib/validators";
import { containsSensitiveContent, SENSITIVE_MESSAGE_ERROR } from "@/lib/support";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentCustomer();
    const guestEmail = req.nextUrl.searchParams.get("email")?.toLowerCase();

    if (!user && !guestEmail) {
      return errorJson("Authentication or guest email required", 401);
    }

    const conversations = await prisma.conversation.findMany({
      where: user ? { userId: user.id } : { guestEmail },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    return safeJson({ conversations });
  } catch {
    return errorJson("Failed to fetch conversations", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentCustomer();
    const body = await req.json();
    const parsed = supportMessageSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    if (containsSensitiveContent(parsed.data.body)) {
      return errorJson(SENSITIVE_MESSAGE_ERROR, 400);
    }

    const guestEmail = parsed.data.guestEmail?.toLowerCase();
    if (!user && !guestEmail) {
      return errorJson("Authentication or guest email required", 401);
    }

    let conversationId = parsed.data.conversationId;

    // Validate order ownership when linking an order
    if (parsed.data.orderId) {
      const linked = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
      if (!linked) return errorJson("Order not found", 404);
      const ownsOrder =
        (user && linked.userId === user.id) ||
        (!!guestEmail && linked.customerEmail === guestEmail);
      if (!ownsOrder) return errorJson("You can only link your own orders", 403);
    }

    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          ...(user ? { userId: user.id } : { guestEmail }),
        },
      });
      if (!existing) return errorJson("Conversation not found", 404);
    } else {
      const conversation = await prisma.conversation.create({
        data: {
          userId: user?.id || null,
          guestName: parsed.data.guestName || (user ? `${user.firstName} ${user.lastName}` : null),
          guestEmail: user ? user.email : guestEmail!,
          orderId: parsed.data.orderId || null,
          subject: parsed.data.subject || "Support request",
        },
      });
      conversationId = conversation.id;
    }

    const senderName = user
      ? `${user.firstName} ${user.lastName}`
      : parsed.data.guestName || "Guest";

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType: "customer",
        senderName,
        body: parsed.data.body,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), unreadAdmin: { increment: 1 } },
    });

    return safeJson({ conversationId, message }, 201);
  } catch {
    return errorJson("Failed to send message", 500);
  }
}
