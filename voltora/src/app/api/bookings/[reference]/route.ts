import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeBookingAccessToken } from "@/lib/tickets";
import { errorJson, safeJson } from "@/lib/utils";

type Params = { params: Promise<{ reference: string }> };

export async function GET(request: Request, { params }: Params) {
  const { reference } = await params;
  const user = await getCurrentCustomer();
  const token = new URL(request.url).searchParams.get("token");
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      match: { include: { venue: true } },
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      deliveries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) return errorJson("Booking not found", 404);
  const tokenValid = token && booking.accessTokenHash === safeBookingAccessToken(token);
  if (booking.userId ? booking.userId !== user?.id && !tokenValid : !tokenValid) {
    return errorJson("Access denied", 403);
  }
  return safeJson({ booking: { ...booking, accessTokenHash: undefined } });
}
