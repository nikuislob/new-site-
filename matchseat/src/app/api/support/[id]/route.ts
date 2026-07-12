import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const customer = await getCurrentCustomer();
  const guestEmail = searchParams.get("guestEmail")?.toLowerCase().trim();

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) return errorJson("Conversation not found.", 404);

  const ownsConversation = Boolean(customer && conversation.userId === customer.id);
  const guestMatches = Boolean(guestEmail && conversation.guestEmail?.toLowerCase() === guestEmail);
  if (!ownsConversation && !guestMatches) {
    return errorJson(customer || guestEmail ? "Forbidden" : "Unauthorized", customer || guestEmail ? 403 : 401);
  }

  return safeJson({ conversation, messages: conversation.messages });
}
