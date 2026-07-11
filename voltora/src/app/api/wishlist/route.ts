import { NextRequest } from "next/server";
import { requireCustomer, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/products";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ productId: z.string().min(1) });

export async function GET() {
  try {
    const user = await requireCustomer();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: { include: { brand: true, category: true, images: true, variants: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return safeJson({
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        createdAt: item.createdAt,
        product: serializeProduct(item.product),
      })),
    });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch wishlist", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("productId required", 400);

    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product || !product.isActive) return errorJson("Product not found", 404);

    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
      create: { userId: user.id, productId: parsed.data.productId },
      update: {},
    });

    return safeJson({ item }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to add to wishlist", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireCustomer();
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) return errorJson("productId required", 400);

    await prisma.wishlistItem.deleteMany({
      where: { userId: user.id, productId },
    });

    return safeJson({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to remove from wishlist", 500);
  }
}
