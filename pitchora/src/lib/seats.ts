import { prisma } from "./db";

type SeatSeed = {
  section: string;
  row: string;
  number: number;
  category: "UPPER" | "CLOSER";
};

export function buildSeatPlan(): SeatSeed[] {
  const seats: SeatSeed[] = [];

  // Closer view — lower bowl
  for (const section of ["A", "B", "C", "D"]) {
    for (const row of ["1", "2", "3", "4", "5"]) {
      for (let number = 1; number <= 8; number++) {
        seats.push({ section: `CL-${section}`, row, number, category: "CLOSER" });
      }
    }
  }

  // Upper side — upper bowl
  for (const section of ["E", "F", "G", "H"]) {
    for (const row of ["6", "7", "8", "9", "10"]) {
      for (let number = 1; number <= 10; number++) {
        seats.push({ section: `UP-${section}`, row, number, category: "UPPER" });
      }
    }
  }

  return seats;
}

export async function ensureSeatsForMatch(matchId: string) {
  const count = await prisma.seat.count({ where: { matchId } });
  if (count > 0) return;

  const plan = buildSeatPlan();
  await prisma.seat.createMany({
    data: plan.map((seat) => ({
      matchId,
      section: seat.section,
      row: seat.row,
      number: seat.number,
      category: seat.category,
      status: "AVAILABLE",
    })),
  });
}

export function seatLabel(seat: { section: string; row: string; number: number }) {
  return `${seat.section}-${seat.row}-${seat.number}`;
}
