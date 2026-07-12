import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { availableInventory, releaseExpiredReservations } from "@/lib/inventory";
import { availabilityLabel, errorJson, safeJson } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  await releaseExpiredReservations();
  const { slug } = await ctx.params;
  const match = await prisma.match.findUnique({
    where: { slug },
    include: {
      categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      zones: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { category: true },
      },
    },
  });

  if (!match || !match.isActive) return errorJson("Match not found", 404);

  const categories = match.categories.map((c) => {
    const available = availableInventory(c.totalInventory, c.reservedCount, c.soldCount);
    return {
      ...c,
      available,
      availability: availabilityLabel(available, c.totalInventory),
    };
  });

  return safeJson({
    match: {
      ...match,
      matchDate: match.matchDate.toISOString(),
      categories,
      zones: match.zones.map((z) => ({
        id: z.id,
        code: z.code,
        name: z.name,
        viewingQuality: z.viewingQuality,
        svgPathId: z.svgPathId,
        categoryId: z.categoryId,
        categoryName: z.category.name,
        categorySlug: z.category.slug,
        priceCents: z.category.priceCents,
        description: z.category.description,
        available: availableInventory(
          z.category.totalInventory,
          z.category.reservedCount,
          z.category.soldCount
        ),
        availability: availabilityLabel(
          availableInventory(z.category.totalInventory, z.category.reservedCount, z.category.soldCount),
          z.category.totalInventory
        ),
      })),
    },
  });
}
