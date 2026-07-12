import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { createBookingFromReservation } from "@/lib/tickets";
import { errorJson, safeJson } from "@/lib/utils";

const schema = z.object({
  reservationToken: z.string().min(20),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(30),
  country: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid customer details", 400);
    const user = await getCurrentCustomer();
    const { reservationToken, ...customer } = parsed.data;
    const result = await createBookingFromReservation(reservationToken, customer, user?.id);
    return safeJson({
      booking: result.booking,
      accessToken: result.accessToken,
    }, 201);
  } catch (error) {
    return errorJson(error instanceof Error ? error.message : "Unable to create booking", 409);
  }
}
