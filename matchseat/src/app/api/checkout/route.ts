import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calcCartTotals,
  CartLine,
  resolvePaymentUrl,
  validateCartLines,
} from "@/lib/tickets";
import { errorJson, generateOrderNumber, safeJson } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validators";

class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizeLines(lines: CartLine[]): CartLine[] {
  const grouped = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.matchId}:${line.seatTier}`;
    const current = grouped.get(key);
    if (current) current.quantity += line.quantity;
    else grouped.set(key, { ...line });
  }
  return [...grouped.values()];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Invalid checkout details.", 422, { issues: parsed.error.issues });
  }

  const customer = await getCurrentCustomer();
  const lines = normalizeLines(parsed.data.items);
  const cartError = validateCartLines(lines);
  if (cartError) return errorJson(cartError, 422);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const totals = calcCartTotals(lines);
      const paymentMethod = await tx.paymentMethod.findFirst({
        where: { id: parsed.data.paymentMethodId, isActive: true },
        include: {
          overrides: {
            where: { amountCents: totals.totalCents, isActive: true },
            take: 1,
          },
        },
      });

      if (!paymentMethod) throw new CheckoutError("Payment method is unavailable.", 422);

      const matches = await tx.match.findMany({
        where: { id: { in: lines.map((line) => line.matchId) }, isPublished: true },
      });
      const matchById = new Map(matches.map((match) => [match.id, match]));

      if (matchById.size !== new Set(lines.map((line) => line.matchId)).size) {
        throw new CheckoutError("One or more matches are unavailable.", 422);
      }

      for (const line of lines) {
        const match = matchById.get(line.matchId);
        if (!match) throw new CheckoutError("One or more matches are unavailable.", 422);

        const stock = line.seatTier === "BASIC" ? match.basicStock : match.premiumStock;
        if (stock < line.quantity) {
          throw new CheckoutError(`Not enough ${line.seatTier.toLowerCase()} seats for ${match.homeTeam} vs ${match.awayTeam}.`, 409);
        }
      }

      const paymentUrl = resolvePaymentUrl(
        paymentMethod.urlTemplate,
        totals.totalCents,
        paymentMethod.overrides[0]?.paymentUrl
      );

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: customer?.id,
          guestEmail: parsed.data.guestEmail.toLowerCase().trim(),
          guestName: parsed.data.guestName.trim(),
          guestPhone: parsed.data.guestPhone?.trim() || null,
          status: "PAYMENT_PENDING",
          paymentStatus: "PENDING",
          paymentMethodId: paymentMethod.id,
          paymentMethodName: paymentMethod.name,
          paymentUrlUsed: paymentUrl,
          subtotalCents: totals.subtotalCents,
          totalCents: totals.totalCents,
          ticketCount: totals.ticketCount,
          billingCity: parsed.data.billingCity.trim(),
          billingState: parsed.data.billingState.trim(),
          billingZip: parsed.data.billingZip.trim(),
          items: {
            create: lines.map((line) => {
              const match = matchById.get(line.matchId);
              if (!match) throw new CheckoutError("One or more matches are unavailable.", 422);
              const unitPriceCents = line.seatTier === "BASIC" ? 7000 : 14000;
              return {
                matchId: line.matchId,
                seatTier: line.seatTier,
                quantity: line.quantity,
                unitPriceCents,
                lineTotalCents: unitPriceCents * line.quantity,
                sectionLabel: line.seatTier === "BASIC" ? "Basic Bowl" : "Premium Club",
                matchSnapshot: JSON.stringify({
                  id: match.id,
                  slug: match.slug,
                  homeTeam: match.homeTeam,
                  awayTeam: match.awayTeam,
                  stage: match.stage,
                  groupName: match.groupName,
                  kickoffAt: match.kickoffAt,
                  venueName: match.venueName,
                  venueCity: match.venueCity,
                  venueState: match.venueState,
                }),
              };
            }),
          },
        },
        include: {
          items: { include: { match: true } },
          paymentMethod: true,
        },
      });

      for (const line of lines) {
        const update =
          line.seatTier === "BASIC"
            ? await tx.match.updateMany({
                where: { id: line.matchId, basicStock: { gte: line.quantity } },
                data: { basicStock: { decrement: line.quantity } },
              })
            : await tx.match.updateMany({
                where: { id: line.matchId, premiumStock: { gte: line.quantity } },
                data: { premiumStock: { decrement: line.quantity } },
              });

        if (update.count !== 1) {
          throw new CheckoutError("Ticket inventory changed. Please try again.", 409);
        }
      }

      return {
        order,
        paymentUrl,
        paymentMethod: {
          id: paymentMethod.id,
          code: paymentMethod.code,
          name: paymentMethod.name,
          iconUrl: paymentMethod.iconUrl,
          buttonText: paymentMethod.buttonText,
          instructions: paymentMethod.instructions,
        },
      };
    });

    return safeJson(result, 201);
  } catch (error) {
    if (error instanceof CheckoutError) return errorJson(error.message, error.status);
    throw error;
  }
}
