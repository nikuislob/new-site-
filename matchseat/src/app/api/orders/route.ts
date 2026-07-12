import { AuthError, getCurrentCustomer, requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

const orderInclude = {
  items: { include: { match: true } },
  paymentMethod: true,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");
    const orderNumber = searchParams.get("orderNumber");

    if (mine === "1") {
      const user = await requireCustomer();
      const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: orderInclude,
        orderBy: { createdAt: "desc" },
      });
      return safeJson({ orders });
    }

    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: orderInclude,
      });
      if (!order) return errorJson("Order not found.", 404);

      const guestEmail = searchParams.get("guestEmail")?.toLowerCase().trim();
      const customer = await getCurrentCustomer();
      const ownsOrder = Boolean(customer && order.userId === customer.id);
      const guestMatches = Boolean(guestEmail && order.guestEmail?.toLowerCase() === guestEmail);
      if (customer || guestEmail) {
        if (!ownsOrder && !guestMatches) return errorJson("Forbidden", 403);
      }

      return safeJson({ order });
    }

    return errorJson("Provide mine=1 or orderNumber.", 400);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    throw error;
  }
}
