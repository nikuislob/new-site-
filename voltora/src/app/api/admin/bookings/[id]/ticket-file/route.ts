import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { adminCan, AuthError, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "deliveries")) return errorJson("Forbidden", 403);
    const { id } = await params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return errorJson("Booking not found", 404);
    if (booking.paymentStatus !== "PAID") return errorJson("Tickets can only be assigned to paid orders", 409);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorJson("PDF ticket file is required", 400);
    if (file.type !== "application/pdf") return errorJson("Only PDF ticket files are accepted", 400);
    const maxBytes = (Number(process.env.MAX_TICKET_UPLOAD_MB) || 10) * 1024 * 1024;
    if (file.size > maxBytes) return errorJson("Ticket file is too large", 413);
    const key = `${randomBytes(24).toString("hex")}.pdf`;
    const directory = path.join(process.cwd(), ".ticket-files");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, key), Buffer.from(await file.arrayBuffer()), { mode: 0o600 });
    const current = await prisma.ticketDelivery.findFirst({ where: { bookingId: id } });
    const delivery = current
      ? await prisma.ticketDelivery.update({ where: { id: current.id }, data: { secureFileKey: key, originalFileName: file.name, status: "READY" } })
      : await prisma.ticketDelivery.create({ data: { bookingId: id, method: booking.deliveryMethod, secureFileKey: key, originalFileName: file.name, status: "READY" } });
    await logAdminActivity(admin.id, "TICKET_FILE_ASSIGNED", "Booking", id, JSON.stringify({ deliveryId: delivery.id }));
    return safeJson({ delivery: { ...delivery, secureFileKey: undefined } }, 201);
  } catch (error) {
    if (error instanceof AuthError) return errorJson(error.message, error.status);
    return errorJson("Unable to upload ticket file", 500);
  }
}
