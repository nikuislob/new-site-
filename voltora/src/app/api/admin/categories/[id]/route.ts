import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify, safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "categories")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.name) data.slug = slugify(parsed.data.name);

    const category = await prisma.category.update({ where: { id }, data });
    return safeJson({ category });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update category", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "categories")) return errorJson("Forbidden", 403);

    const { id } = await params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) return errorJson("Cannot delete category with products", 400);

    await prisma.category.delete({ where: { id } });
    return safeJson({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to delete category", 500);
  }
}
