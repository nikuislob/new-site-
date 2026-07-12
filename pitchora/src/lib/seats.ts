import { nanoid } from "nanoid";
import { prisma } from "./db";

export const HOLD_MINUTES = 15;
export const RANDOM_SEAT_LIMIT = 9;

export type SeatCategory = "UPPER" | "CLOSER";

type SeatSeed = {
  section: string;
  block: string;
  row: string;
  number: number;
  category: SeatCategory;
};

/** Map stadium sections to approximate SVG map zones */
export const SECTION_MAP_ZONE: Record<string, string> = {
  "CL-A": "north",
  "CL-B": "east",
  "CL-C": "south",
  "CL-D": "west",
  "UP-E": "north",
  "UP-F": "east",
  "UP-G": "south",
  "UP-H": "west",
};

export function buildSeatPlan(): SeatSeed[] {
  const seats: SeatSeed[] = [];

  // Closer view — lower bowl around the pitch
  for (const section of ["A", "B", "C", "D"]) {
    for (const row of ["1", "2", "3", "4", "5"]) {
      for (let number = 1; number <= 8; number++) {
        seats.push({
          section: `CL-${section}`,
          block: `Block ${section}${row}`,
          row,
          number,
          category: "CLOSER",
        });
      }
    }
  }

  // Upper side — upper bowl
  for (const section of ["E", "F", "G", "H"]) {
    for (const row of ["6", "7", "8", "9", "10"]) {
      for (let number = 1; number <= 10; number++) {
        seats.push({
          section: `UP-${section}`,
          block: `Block ${section}${row}`,
          row,
          number,
          category: "UPPER",
        });
      }
    }
  }

  return seats;
}

export async function ensureSeatsForMatch(matchId: string, prices?: { upper: number; closer: number }) {
  const count = await prisma.seat.count({ where: { matchId } });
  if (count > 0) return;

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const upper = prices?.upper ?? settings?.upperSeatPrice ?? 89;
  const closer = prices?.closer ?? settings?.closerSeatPrice ?? 218;

  const plan = buildSeatPlan();
  await prisma.seat.createMany({
    data: plan.map((seat) => ({
      matchId,
      section: seat.section,
      block: seat.block,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      price: seat.category === "CLOSER" ? closer : upper,
      currency: "USD",
      status: "AVAILABLE",
    })),
  });
}

export function seatLabel(seat: { section: string; row: string; number: number; block?: string }) {
  return `${seat.section} · Row ${seat.row} · Seat ${seat.number}`;
}

export function publicSeat(seat: {
  id: string;
  section: string;
  block: string;
  row: string;
  number: number;
  category: string;
  price: number;
  currency: string;
  status: string;
  holdExpiresAt?: Date | null;
}) {
  return {
    id: seat.id,
    section: seat.section,
    block: seat.block,
    row: seat.row,
    number: seat.number,
    category: seat.category,
    price: seat.price,
    currency: seat.currency,
    status: seat.status,
    label: seatLabel(seat),
    mapZone: SECTION_MAP_ZONE[seat.section] || "north",
    holdExpiresAt: seat.holdExpiresAt ? seat.holdExpiresAt.toISOString() : null,
  };
}

/** Release expired holds back to AVAILABLE */
export async function releaseExpiredHolds(matchId?: string) {
  const now = new Date();
  await prisma.seat.updateMany({
    where: {
      status: "HELD",
      holdExpiresAt: { lt: now },
      ...(matchId ? { matchId } : {}),
    },
    data: {
      status: "AVAILABLE",
      holdToken: null,
      holdExpiresAt: null,
      orderId: null,
    },
  });
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Backend-only: pick up to 9 random AVAILABLE seats for a match.
 * Optionally restore seats already HELD by this holdToken.
 */
export async function getRandomAvailableSeats(options: {
  matchId: string;
  category?: string | null;
  limit?: number;
  holdToken?: string | null;
}) {
  const limit = options.limit ?? RANDOM_SEAT_LIMIT;
  await releaseExpiredHolds(options.matchId);
  await ensureSeatsForMatch(options.matchId);

  const heldByToken = options.holdToken
    ? await prisma.seat.findMany({
        where: {
          matchId: options.matchId,
          holdToken: options.holdToken,
          status: "HELD",
          holdExpiresAt: { gt: new Date() },
          ...(options.category ? { category: options.category } : {}),
        },
      })
    : [];

  const remainingSlots = Math.max(0, limit - heldByToken.length);

  const available = await prisma.seat.findMany({
    where: {
      matchId: options.matchId,
      status: "AVAILABLE",
      ...(options.category ? { category: options.category } : {}),
    },
  });

  shuffleInPlace(available);
  const randomPick = available.slice(0, remainingSlots);

  const totalAvailable = await prisma.seat.count({
    where: {
      matchId: options.matchId,
      status: "AVAILABLE",
      ...(options.category ? { category: options.category } : {}),
    },
  });

  const offered = [...heldByToken, ...randomPick];

  return {
    seats: offered.map(publicSeat),
    heldSeats: heldByToken.map(publicSeat),
    offeredCount: offered.length,
    totalAvailable,
    limit,
    scarcityMessage:
      totalAvailable > limit
        ? `Only ${offered.length} available seat options shown`
        : totalAvailable === 0
          ? "No seats currently available"
          : `${totalAvailable} seat${totalAvailable === 1 ? "" : "s"} remaining`,
  };
}

export async function createSeatHold(options: {
  matchId: string;
  seatIds: string[];
  holdToken?: string | null;
  minutes?: number;
}) {
  await releaseExpiredHolds(options.matchId);

  const token = options.holdToken || nanoid(24);
  const expiresAt = new Date(Date.now() + (options.minutes ?? HOLD_MINUTES) * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const seats = await tx.seat.findMany({
      where: { id: { in: options.seatIds }, matchId: options.matchId },
    });

    if (seats.length !== options.seatIds.length) {
      throw new HoldError("One or more seats were not found", 400);
    }

    for (const seat of seats) {
      const ownedByToken = seat.status === "HELD" && seat.holdToken === token && seat.holdExpiresAt && seat.holdExpiresAt > new Date();
      const available = seat.status === "AVAILABLE";
      if (!ownedByToken && !available) {
        throw new HoldError(`Seat ${seatLabel(seat)} is no longer available`, 409);
      }
    }

    // Clear previous holds for this token that are not in the new selection
    await tx.seat.updateMany({
      where: {
        matchId: options.matchId,
        holdToken: token,
        status: "HELD",
        id: { notIn: options.seatIds },
      },
      data: {
        status: "AVAILABLE",
        holdToken: null,
        holdExpiresAt: null,
      },
    });

    await tx.seat.updateMany({
      where: { id: { in: options.seatIds }, matchId: options.matchId },
      data: {
        status: "HELD",
        holdToken: token,
        holdExpiresAt: expiresAt,
      },
    });

    const held = await tx.seat.findMany({
      where: { id: { in: options.seatIds } },
    });

    return {
      holdToken: token,
      expiresAt: expiresAt.toISOString(),
      seats: held.map(publicSeat),
    };
  });
}

export class HoldError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
