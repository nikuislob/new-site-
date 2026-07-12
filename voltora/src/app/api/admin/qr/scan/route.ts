import { NextRequest } from "next/server";
import { AuthError, adminCan, requireAdmin } from "@/lib/auth";
import { checkInTicket, validateQrToken } from "@/lib/tickets";
import { qrScanSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "tickets") && !adminCan(admin.role, "tickets:read")) {
      return errorJson("Forbidden", 403);
    }

    const body = await req.json();
    const parsed = qrScanSchema.safeParse(body);
    if (!parsed.success) return errorJson("Invalid scan payload", 400);

    if (parsed.data.action === "checkin") {
      if (!adminCan(admin.role, "tickets") && admin.role !== "SUPER_ADMIN") {
        return errorJson("Forbidden", 403);
      }
      const result = await checkInTicket(parsed.data.token, admin.name);
      if (!result.valid) {
        return safeJson({ valid: false, reason: result.reason, ticket: serialize(result.ticket) });
      }
      return safeJson({ valid: true, ticket: serialize(result.ticket) });
    }

    const result = await validateQrToken(parsed.data.token);
    if (!result.valid) {
      return safeJson({ valid: false, reason: result.reason, ticket: serialize(result.ticket) });
    }
    return safeJson({ valid: true, ticket: serialize(result.ticket) });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Scan failed", 500);
  }
}

function serialize(ticket: any) {
  if (!ticket) return null;
  return {
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    holderName: ticket.holderName,
    categoryName: ticket.categoryName,
    zoneName: ticket.zoneName,
    checkedInAt: ticket.checkedInAt,
    orderNumber: ticket.order?.orderNumber,
    match: ticket.order?.match
      ? {
          title: ticket.order.match.title,
          matchDate: ticket.order.match.matchDate,
          stadiumName: ticket.order.match.stadiumName,
        }
      : null,
  };
}
