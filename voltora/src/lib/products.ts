import type { Prisma, Product, ProductImage, ProductVariant, Brand, Category } from "@prisma/client";
import { prisma } from "./db";
import { discountPercent, parseJsonArray, parseJsonObject } from "./utils";

export type ProductWithRelations = Product & {
  brand: Brand;
  category: Category;
  images: ProductImage[];
  variants?: ProductVariant[];
};

export function serializeProduct(p: ProductWithRelations) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    brand: { id: p.brand.id, name: p.brand.name, slug: p.brand.slug },
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription,
    specifications: parseJsonObject(p.specifications),
    mainImage: p.mainImage,
    images: p.images.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt || p.name,
    })),
    originalPrice: p.originalPrice,
    sellingPrice: p.sellingPrice,
    discountPercent: discountPercent(p.originalPrice, p.sellingPrice),
    stockQuantity: p.stockQuantity,
    inStock: p.stockQuantity > 0,
    condition: p.condition,
    deliveryEstimate: p.deliveryEstimate,
    badges: parseJsonArray(p.badges),
    isFeatured: p.isFeatured,
    isTrending: p.isTrending,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    isActive: p.isActive,
    relatedIds: parseJsonArray(p.relatedIds),
    variants: (p.variants || [])
      .filter((v) => v.isActive)
      .map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        color: v.color,
        storage: v.storage,
        priceModifier: v.priceModifier,
        stockQuantity: v.stockQuantity,
        inStock: v.stockQuantity > 0,
        imageUrl: v.imageUrl,
      })),
    viewCount: p.viewCount,
    salesCount: p.salesCount,
    createdAt: p.createdAt,
  };
}

const productInclude = {
  brand: true,
  category: true,
  images: true,
  variants: { where: { isActive: true } },
} satisfies Prisma.ProductInclude;

export type ProductListParams = {
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  availability?: string;
  badge?: string;
  sort?: string;
  q?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
};

export function buildProductWhere(params: ProductListParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.categorySlug) {
    where.category = { OR: [{ slug: params.categorySlug }, { parent: { slug: params.categorySlug } }] };
  }
  if (params.brandSlug) where.brand = { slug: params.brandSlug };
  if (params.condition) where.condition = params.condition as Product["condition"];
  if (params.availability === "in_stock") where.stockQuantity = { gt: 0 };
  if (params.availability === "out_of_stock") where.stockQuantity = { lte: 0 };
  if (params.featured) where.isFeatured = true;
  if (params.trending) where.isTrending = true;
  if (params.bestSeller) where.isBestSeller = true;
  if (params.newArrival) where.isNewArrival = true;
  if (params.badge) {
    where.badges = { contains: params.badge };
  }
  if (params.minPrice != null || params.maxPrice != null) {
    where.sellingPrice = {};
    if (params.minPrice != null) where.sellingPrice.gte = params.minPrice;
    if (params.maxPrice != null) where.sellingPrice.lte = params.maxPrice;
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { shortDescription: { contains: params.q } },
      { brand: { name: { contains: params.q } } },
    ];
  }

  return where;
}

export function buildProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ sellingPrice: "asc" }];
    case "price-desc":
      return [{ sellingPrice: "desc" }];
    case "popular":
      return [{ salesCount: "desc" }];
    case "name":
      return [{ name: "asc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listProducts(params: ProductListParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(48, params.limit || 24);
  const where = buildProductWhere(params);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: buildProductOrderBy(params.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: items.map(serializeProduct),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productInclude,
  });
  return product ? serializeProduct(product) : null;
}

export async function getRelatedProducts(ids: string[]) {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: productInclude,
    take: 4,
  });
  return products.map(serializeProduct);
}
