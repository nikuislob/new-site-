import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return safeJson({ products: [], categories: [], brands: [] });
    }

    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          mainImage: true,
          sellingPrice: true,
        },
        take: 6,
        orderBy: { salesCount: "desc" },
      }),
      prisma.category.findMany({
        where: { isActive: true, name: { contains: q } },
        select: { id: true, name: true, slug: true },
        take: 4,
      }),
      prisma.brand.findMany({
        where: { isActive: true, name: { contains: q } },
        select: { id: true, name: true, slug: true, logoUrl: true },
        take: 4,
      }),
    ]);

    return safeJson({ products, categories, brands });
  } catch {
    return errorJson("Search failed", 500);
  }
}
