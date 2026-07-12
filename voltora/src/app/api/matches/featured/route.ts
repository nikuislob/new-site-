import { prisma } from "@/lib/db";
import { availableInventory, releaseExpiredReservations } from "@/lib/inventory";
import { getSettings } from "@/lib/settings";
import { availabilityLabel, safeJson } from "@/lib/utils";

function serializeSeat(seat: {
  id: string;
  section: string;
  block: string;
  row: string;
  seatNumber: string;
  status: string;
  posX: number;
  posY: number;
  zoneId: string;
  categoryId: string;
  zone: { code: string; name: string; viewingQuality: string; svgPathId: string };
  category: { name: string; slug: string; priceCents: number; description: string };
}) {
  return {
    id: seat.id,
    section: seat.section,
    block: seat.block,
    row: seat.row,
    seatNumber: seat.seatNumber,
    status: seat.status,
    posX: seat.posX,
    posY: seat.posY,
    zoneId: seat.zoneId,
    zoneCode: seat.zone.code,
    zoneName: seat.zone.name,
    viewingQuality: seat.zone.viewingQuality,
    svgPathId: seat.zone.svgPathId,
    categoryId: seat.categoryId,
    categoryName: seat.category.name,
    categorySlug: seat.category.slug,
    priceCents: seat.category.priceCents,
    description: seat.category.description,
    available: seat.status === "AVAILABLE",
  };
}

export async function GET() {
  await releaseExpiredReservations();
  const settings = await getSettings();

  const match = await prisma.match.findFirst({
    where: { isActive: true, isFeatured: true },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      zones: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { category: true },
      },
      seats: {
        include: { zone: true, category: true },
        orderBy: [{ section: "asc" }, { row: "asc" }, { seatNumber: "asc" }],
      },
    },
    orderBy: { matchDate: "asc" },
  });

  if (!match) {
    return safeJson({ match: null, settings });
  }

  const availableSeats = match.seats.filter((s) => s.status === "AVAILABLE").length;
  const categories = match.categories.map((c) => {
    const seatAvail = match.seats.filter(
      (s) => s.categoryId === c.id && s.status === "AVAILABLE"
    ).length;
    const available = Math.min(
      seatAvail,
      availableInventory(c.totalInventory, c.reservedCount, c.soldCount)
    );
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      priceCents: c.priceCents,
      totalInventory: c.totalInventory,
      reservedCount: c.reservedCount,
      soldCount: c.soldCount,
      available,
      availability: availabilityLabel(available, c.totalInventory),
      sortOrder: c.sortOrder,
    };
  });

  const totalAvailable = categories.reduce((sum, c) => sum + c.available, 0);
  const totalInventory = categories.reduce((sum, c) => sum + c.totalInventory, 0);
  const overallAvailability =
    match.isSoldOut || totalAvailable <= 0
      ? "SOLD OUT"
      : availabilityLabel(totalAvailable, totalInventory);

  return safeJson({
    settings,
    match: {
      id: match.id,
      slug: match.slug,
      title: match.title,
      teamAName: match.teamAName,
      teamBName: match.teamBName,
      teamACode: match.teamACode,
      teamBCode: match.teamBCode,
      teamAFlagUrl: match.teamAFlagUrl,
      teamBFlagUrl: match.teamBFlagUrl,
      matchDate: match.matchDate.toISOString(),
      stadiumName: match.stadiumName,
      city: match.city,
      description: match.description,
      salesEnabled: match.salesEnabled,
      isSoldOut: match.isSoldOut || totalAvailable <= 0,
      availability: overallAvailability,
      availableSeatCount: availableSeats,
      categories,
      zones: match.zones.map((z) => ({
        id: z.id,
        code: z.code,
        name: z.name,
        sectionLabel: z.sectionLabel,
        viewingQuality: z.viewingQuality,
        svgPathId: z.svgPathId,
        categoryId: z.categoryId,
        categoryName: z.category.name,
        priceCents: z.category.priceCents,
        available: match.seats.filter((s) => s.zoneId === z.id && s.status === "AVAILABLE").length,
      })),
      seats: match.seats.map(serializeSeat),
    },
  });
}
