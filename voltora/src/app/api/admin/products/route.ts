import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { slugify, safeJson, errorJson } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const page = Math.max(1, Number(sp.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 20)));

    const where: Prisma.ProductWhereInput = {};
    if (q) {
      where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { brand: true, category: true, images: true, variants: true },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return safeJson({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch products", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const data = parsed.data;
    let slug = slugify(data.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug,
        brandId: data.brandId,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        specifications: JSON.stringify(data.specifications || {}),
        mainImage: data.mainImage,
        originalPrice: data.originalPrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        condition: data.condition || "NEW",
        deliveryEstimate: data.deliveryEstimate || "3-5 business days",
        badges: JSON.stringify(data.badges || []),
        isFeatured: data.isFeatured ?? false,
        isTrending: data.isTrending ?? false,
        isBestSeller: data.isBestSeller ?? false,
        isNewArrival: data.isNewArrival ?? false,
        isActive: data.isActive ?? true,
        relatedIds: JSON.stringify(data.relatedIds || []),
        images: {
          create: (data.images || [data.mainImage]).map((url, i) => ({
            url,
            alt: data.name,
            sortOrder: i,
          })),
        },
        variants: data.variants?.length
          ? {
              create: data.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                color: v.color || null,
                storage: v.storage || null,
                priceModifier: v.priceModifier ?? 0,
                stockQuantity: v.stockQuantity,
                imageUrl: v.imageUrl || null,
                isActive: v.isActive ?? true,
              })),
            }
          : undefined,
      },
      include: { brand: true, category: true, images: true, variants: true },
    });

    return safeJson({ product }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to create product", 500);
  }
}
