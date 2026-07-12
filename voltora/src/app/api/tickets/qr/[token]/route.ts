import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateQrDataUrl, qrPayload } from "@/lib/tickets";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const ticket = await prisma.ticket.findUnique({
    where: { qrToken: token },
    include: { order: { include: { match: true } } },
  });
  if (!ticket) return errorJson("Invalid ticket", 404);

  // Public QR endpoint only confirms existence for scanners that open the URL;
  // check-in requires authenticated staff endpoint.
  return safeJson({
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    categoryName: ticket.categoryName,
    zoneName: ticket.zoneName,
    match: {
      title: ticket.order.match.title,
      matchDate: ticket.order.match.matchDate.toISOString(),
      stadiumName: ticket.order.match.stadiumName,
    },
    verifyHint: "Present this pass to authorized stadium staff for entry validation.",
    qrDataUrl: await generateQrDataUrl(ticket.qrToken),
    payload: qrPayload(ticket.qrToken),
  });
}
