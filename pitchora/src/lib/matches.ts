import { prisma } from "./db";

export async function expirePastMatches() {
  const now = new Date();
  await prisma.match.updateMany({
    where: {
      kickoffAt: { lt: now },
      status: { not: "COMPLETED" },
    },
    data: { status: "COMPLETED" },
  });
}

export function upcomingMatchWhere() {
  return {
    kickoffAt: { gt: new Date() },
    status: { not: "COMPLETED" },
  };
}

export async function getUpcomingMatches(limit?: number) {
  await expirePastMatches();
  return prisma.match.findMany({
    where: upcomingMatchWhere(),
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: { kickoffAt: "asc" },
    ...(limit ? { take: limit } : {}),
  });
}

export function availableSeats(match: {
  upperSeatsTotal: number;
  closerSeatsTotal: number;
  upperSeatsSold: number;
  closerSeatsSold: number;
}) {
  return {
    upperAvailable: Math.max(0, match.upperSeatsTotal - match.upperSeatsSold),
    closerAvailable: Math.max(0, match.closerSeatsTotal - match.closerSeatsSold),
    totalAvailable:
      Math.max(0, match.upperSeatsTotal - match.upperSeatsSold) +
      Math.max(0, match.closerSeatsTotal - match.closerSeatsSold),
  };
}

export function serializeMatch<
  T extends {
    kickoffAt: Date;
    createdAt: Date;
    updatedAt: Date;
    homeTeam: { createdAt: Date; updatedAt: Date };
    awayTeam: { createdAt: Date; updatedAt: Date };
    upperSeatsTotal: number;
    closerSeatsTotal: number;
    upperSeatsSold: number;
    closerSeatsSold: number;
  },
>(match: T) {
  const availability = availableSeats(match);
  return {
    ...match,
    kickoffAt: match.kickoffAt.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
    homeTeam: {
      ...match.homeTeam,
      createdAt: match.homeTeam.createdAt.toISOString(),
      updatedAt: match.homeTeam.updatedAt.toISOString(),
    },
    awayTeam: {
      ...match.awayTeam,
      createdAt: match.awayTeam.createdAt.toISOString(),
      updatedAt: match.awayTeam.updatedAt.toISOString(),
    },
    ...availability,
  };
}
