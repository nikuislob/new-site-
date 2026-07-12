import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const orderInclude = {
  items: { include: { match: true } },
  paymentMethod: true,
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }] },
    include: orderInclude,
  });

  if (!order) return errorJson("Order not found.", 404);

  const customer = await getCurrentCustomer();
  const guestEmail = searchParams.get("guestEmail")?.toLowerCase().trim();
  const ownsOrder = Boolean(customer && order.userId === customer.id);
  const guestMatches = Boolean(guestEmail && order.guestEmail?.toLowerCase() === guestEmail);

  if (!ownsOrder && !guestMatches) {
    return errorJson(customer || guestEmail ? "Forbidden" : "Unauthorized", customer || guestEmail ? 403 : 401);
  }

  return safeJson({ order });
}
