import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/products";
import { safeJson, errorJson } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  price_asc: { sellingPrice: "asc" },
  price_desc: { sellingPrice: "desc" },
  newest: { createdAt: "desc" },
  popular: { salesCount: "desc" },
  discount: { originalPrice: "desc" },
};

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const category = sp.get("category");
    const brand = sp.get("brand");
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");
    const condition = sp.get("condition");
    const inStock = sp.get("inStock");
    const sort = sp.get("sort") || "newest";
    const page = Math.max(1, Number(sp.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 24)));
    const badge = sp.get("badge");
    const featured = sp.get("featured");
    const trending = sp.get("trending");
    const bestSeller = sp.get("bestSeller");
    const newArrival = sp.get("newArrival");

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { shortDescription: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (brand) {
      where.brand = { slug: brand };
    }

    if (minPrice) where.sellingPrice = { ...(where.sellingPrice as object), gte: Number(minPrice) };
    if (maxPrice) where.sellingPrice = { ...(where.sellingPrice as object), lte: Number(maxPrice) };

    if (condition && ["NEW", "OPEN_BOX", "REFURBISHED"].includes(condition)) {
      where.condition = condition as "NEW" | "OPEN_BOX" | "REFURBISHED";
    }

    if (inStock === "true") where.stockQuantity = { gt: 0 };
    if (featured === "true") where.isFeatured = true;
    if (trending === "true") where.isTrending = true;
    if (bestSeller === "true") where.isBestSeller = true;
    if (newArrival === "true") where.isNewArrival = true;

    if (badge) {
      where.badges = { contains: badge };
    }

    const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { brand: true, category: true, images: true, variants: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return safeJson({
      products: products.map(serializeProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return errorJson("Failed to fetch products", 500);
  }
}
