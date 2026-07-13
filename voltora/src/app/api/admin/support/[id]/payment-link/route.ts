import { z } from "zod";
import { adminCan, AuthError, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { errorJson, safeJson } from "@/lib/utils";

const schema = z.object({ url: z.string().url(), label: z.string().min(2).max(80).default("Complete Payment") });
type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "support")) return errorJson("Forbidden", 403);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid payment link", 400);
    const url = new URL(parsed.data.url);
    if (url.protocol !== "https:") return errorJson("Payment links must use HTTPS", 400);
    const allowlist = (await getSetting("payment_link_allowlist")).split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    const hostname = url.hostname.toLowerCase();
    const allowed = allowlist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    if (!allowed) return errorJson("This payment-link domain is not approved in settings", 400);
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation?.bookingId) return errorJson("Conversation is not linked to a booking", 409);
    const link = await prisma.$transaction(async (tx) => {
      const created = await tx.approvedPaymentLink.create({
        data: { bookingId: conversation.bookingId!, conversationId: id, sentById: admin.id, url: parsed.data.url, label: parsed.data.label },
      });
      await tx.message.create({
        data: { conversationId: id, senderType: "admin", senderName: admin.name, body: "An approved payment link is ready. Use the Complete Payment button below. Opening it will not automatically mark your order as paid." },
      });
      await tx.conversation.update({ where: { id }, data: { lastMessageAt: new Date(), unreadCustomer: { increment: 1 } } });
      return created;
    });
    await logAdminActivity(admin.id, "PAYMENT_LINK_SENT", "Booking", conversation.bookingId, JSON.stringify({ paymentLinkId: link.id, hostname }));
    return safeJson({ paymentLink: { id: link.id, label: link.label, createdAt: link.createdAt } }, 201);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to send payment link", 500);
  }
}
