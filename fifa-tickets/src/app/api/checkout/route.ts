import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validators";
import { canCheckoutOnline, resolvePaymentLinkKey } from "@/lib/payments";
import { generateOrderNumber } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid checkout data", details: parsed.error.flatten() }, { status: 400 });
    }

    const { matchId, categoryId, seatIds, firstName, lastName, email, phone } = parsed.data;

    if (!canCheckoutOnline(seatIds.length)) {
      return NextResponse.json({
        requiresBulk: true,
        error: "Online checkout is limited to 2 tickets. Please use Chat Now for bulk orders.",
      }, { status: 400 });
    }

    const [match, category, seats] = await Promise.all([
      prisma.match.findUnique({ where: { id: matchId } }),
      prisma.ticketCategory.findUnique({ where: { id: categoryId } }),
      prisma.seat.findMany({ where: { id: { in: seatIds } } }),
    ]);

    if (!match || !match.isPublished) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (!category || !category.isActive) {
      return NextResponse.json({ error: "Ticket category unavailable" }, { status: 400 });
    }
    if (seats.length !== seatIds.length) {
      return NextResponse.json({ error: "One or more seats were not found" }, { status: 400 });
    }
    if (seats.some((s) => s.matchId !== matchId || s.categoryId !== categoryId || s.status !== "AVAILABLE")) {
      return NextResponse.json({ error: "Selected seats are no longer available" }, { status: 409 });
    }

    const paymentKey = resolvePaymentLinkKey(category.code, seatIds.length);
    if (!paymentKey) {
      return NextResponse.json({ requiresBulk: true, error: "Bulk inquiry required" }, { status: 400 });
    }

    const paymentLink = await prisma.paymentLink.findUnique({ where: { key: paymentKey } });
    if (!paymentLink || !paymentLink.isActive || !paymentLink.url) {
      return NextResponse.json({ error: "Payment link is not configured for this package. Contact support." }, { status: 503 });
    }

    const customer = await prisma.customer.upsert({
      where: { email: email.toLowerCase() },
      update: {
        firstName,
        lastName,
        phone: phone || undefined,
      },
      create: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || undefined,
      },
    });

    const quantity = seatIds.length;
    const unitPrice = category.price;
    const totalAmount = unitPrice * quantity;
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      // Re-check seats inside transaction
      const locked = await tx.seat.findMany({ where: { id: { in: seatIds } } });
      if (locked.some((s) => s.status !== "AVAILABLE")) {
        throw new Error("SEAT_CONFLICT");
      }

      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { status: "SOLD" },
      });

      return tx.order.create({
        data: {
          orderNumber,
          matchId,
          customerId: customer.id,
          categoryId,
          quantity,
          unitPrice,
          totalAmount,
          paymentLinkKey: paymentKey,
          paymentUrl: paymentLink.url,
          paymentStatus: "PENDING",
          status: "AWAITING_PAYMENT",
          items: {
            create: seatIds.map((seatId) => ({ seatId })),
          },
        },
      });
    });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      paymentUrl: paymentLink.url,
      paymentKey,
      totalAmount,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SEAT_CONFLICT") {
      return NextResponse.json({ error: "Selected seats were just taken. Please choose again." }, { status: 409 });
    }
    console.error("checkout error", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
