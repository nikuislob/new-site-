import { prisma } from "@/lib/db";
import { availableInventory, releaseExpiredReservations } from "@/lib/inventory";
import { getSettings } from "@/lib/settings";
import { availabilityLabel, safeJson } from "@/lib/utils";

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
    },
    orderBy: { matchDate: "asc" },
  });

  if (!match) {
    return safeJson({ match: null, settings });
  }

  const categories = match.categories.map((c) => {
    const available = availableInventory(c.totalInventory, c.reservedCount, c.soldCount);
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
  const overallAvailability = match.isSoldOut || totalAvailable <= 0
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
      categories,
      zones: match.zones.map((z) => ({
        id: z.id,
        code: z.code,
        name: z.name,
        viewingQuality: z.viewingQuality,
        svgPathId: z.svgPathId,
        categoryId: z.categoryId,
        categoryName: z.category.name,
        priceCents: z.category.priceCents,
        available: availableInventory(
          z.category.totalInventory,
          z.category.reservedCount,
          z.category.soldCount
        ),
      })),
    },
  });
}
