import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentCustomer();
  const guestEmail = new URL(request.url).searchParams.get("email")?.toLowerCase();
  const link = await prisma.approvedPaymentLink.findUnique({
    where: { id },
    include: { conversation: true },
  });
  if (!link) return new Response("Payment link not found", { status: 404 });
  const allowed = user
    ? link.conversation.userId === user.id
    : Boolean(guestEmail && link.conversation.guestEmail?.toLowerCase() === guestEmail);
  if (!allowed) return new Response("Access denied", { status: 403 });
  await prisma.approvedPaymentLink.update({ where: { id }, data: { clickedAt: new Date() } });
  return Response.redirect(link.url, 302);
}
