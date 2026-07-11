import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { slugify, safeJson, errorJson } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { brand: true, category: true, images: true, variants: true },
    });

    if (!product) return errorJson("Product not found", 404);
    return safeJson({ product });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch product", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorJson("Product not found", 404);

    const body = await req.json();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
    }
    if (data.brandId !== undefined) updateData.brandId = data.brandId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription;
    if (data.specifications !== undefined) updateData.specifications = JSON.stringify(data.specifications);
    if (data.mainImage !== undefined) updateData.mainImage = data.mainImage;
    if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;
    if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice;
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.deliveryEstimate !== undefined) updateData.deliveryEstimate = data.deliveryEstimate;
    if (data.badges !== undefined) updateData.badges = JSON.stringify(data.badges);
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isTrending !== undefined) updateData.isTrending = data.isTrending;
    if (data.isBestSeller !== undefined) updateData.isBestSeller = data.isBestSeller;
    if (data.isNewArrival !== undefined) updateData.isNewArrival = data.isNewArrival;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.relatedIds !== undefined) updateData.relatedIds = JSON.stringify(data.relatedIds);

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { brand: true, category: true, images: true, variants: true },
    });

    if (data.images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: data.images.map((url, i) => ({
          productId: id,
          url,
          alt: product.name,
          sortOrder: i,
        })),
      });
    }

    if (data.variants) {
      for (const v of data.variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              sku: v.sku,
              color: v.color || null,
              storage: v.storage || null,
              priceModifier: v.priceModifier ?? 0,
              stockQuantity: v.stockQuantity,
              imageUrl: v.imageUrl || null,
              isActive: v.isActive ?? true,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: id,
              name: v.name,
              sku: v.sku,
              color: v.color || null,
              storage: v.storage || null,
              priceModifier: v.priceModifier ?? 0,
              stockQuantity: v.stockQuantity,
              imageUrl: v.imageUrl || null,
              isActive: v.isActive ?? true,
            },
          });
        }
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { brand: true, category: true, images: true, variants: true },
    });

    return safeJson({ product: updated });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update product", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return safeJson({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to delete product", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const duplicate = req.nextUrl.searchParams.get("duplicate");
    if (duplicate !== "1") return errorJson("Use ?duplicate=1 to duplicate", 400);

    const original = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true },
    });
    if (!original) return errorJson("Product not found", 404);

    const newSku = `${original.sku}-COPY-${Date.now()}`;
    const newSlug = `${original.slug}-copy-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        sku: newSku,
        name: `${original.name} (Copy)`,
        slug: newSlug,
        brandId: original.brandId,
        categoryId: original.categoryId,
        shortDescription: original.shortDescription,
        fullDescription: original.fullDescription,
        specifications: original.specifications,
        mainImage: original.mainImage,
        originalPrice: original.originalPrice,
        sellingPrice: original.sellingPrice,
        stockQuantity: original.stockQuantity,
        condition: original.condition,
        deliveryEstimate: original.deliveryEstimate,
        badges: original.badges,
        isFeatured: false,
        isTrending: false,
        isBestSeller: false,
        isNewArrival: false,
        isActive: false,
        relatedIds: original.relatedIds,
        images: {
          create: original.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder,
          })),
        },
        variants: {
          create: original.variants.map((v) => ({
            name: v.name,
            sku: `${v.sku}-COPY-${Date.now()}`,
            color: v.color,
            storage: v.storage,
            priceModifier: v.priceModifier,
            stockQuantity: v.stockQuantity,
            imageUrl: v.imageUrl,
            isActive: v.isActive,
          })),
        },
      },
      include: { brand: true, category: true, images: true, variants: true },
    });

    return safeJson({ product }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to duplicate product", 500);
  }
}
