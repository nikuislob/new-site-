import { readFile } from "fs/promises";
import path from "path";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeBookingAccessToken } from "@/lib/tickets";

type Params = { params: Promise<{ reference: string }> };

export async function GET(request: Request, { params }: Params) {
  const { reference } = await params;
  const user = await getCurrentCustomer();
  const token = new URL(request.url).searchParams.get("token");
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { deliveries: { where: { status: { in: ["READY", "DELIVERED"] } }, take: 1 } },
  });
  if (!booking) return new Response("Booking not found", { status: 404 });
  const tokenValid = token && booking.accessTokenHash === safeBookingAccessToken(token);
  if (booking.userId ? booking.userId !== user?.id && !tokenValid : !tokenValid) return new Response("Access denied", { status: 403 });
  if (booking.paymentStatus !== "PAID") return new Response("Payment verification required", { status: 409 });
  const delivery = booking.deliveries[0];
  if (!delivery?.secureFileKey) return new Response("Ticket file is not ready", { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), ".ticket-files", path.basename(delivery.secureFileKey)));
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(delivery.originalFileName || "pitchpass-ticket.pdf").replaceAll('"', "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Ticket file is unavailable", { status: 404 });
  }
}
