import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/products";
import { getCurrentCustomer } from "@/lib/auth";
import { parseJsonArray } from "@/lib/utils";
import { safeJson, errorJson } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { brand: true, category: true, images: true, variants: true },
    });

    if (!product || !product.isActive) return errorJson("Product not found", 404);

    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    const user = await getCurrentCustomer();
    if (user) {
      await prisma.recentlyViewed.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        create: { userId: user.id, productId: product.id },
        update: { viewedAt: new Date() },
      });
    }

    const relatedIds = parseJsonArray(product.relatedIds);
    let related: ReturnType<typeof serializeProduct>[] = [];

    if (relatedIds.length > 0) {
      const relatedProducts = await prisma.product.findMany({
        where: { id: { in: relatedIds }, isActive: true },
        include: { brand: true, category: true, images: true, variants: true },
        take: 8,
      });
      related = relatedProducts.map(serializeProduct);
    } else {
      const relatedProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: product.categoryId,
          id: { not: product.id },
        },
        include: { brand: true, category: true, images: true, variants: true },
        orderBy: { salesCount: "desc" },
        take: 8,
      });
      related = relatedProducts.map(serializeProduct);
    }

    return safeJson({
      product: serializeProduct({ ...product, viewCount: product.viewCount + 1 }),
      related,
    });
  } catch {
    return errorJson("Failed to fetch product", 500);
  }
}
