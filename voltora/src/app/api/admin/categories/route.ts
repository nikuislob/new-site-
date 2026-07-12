import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableInventory } from "@/lib/inventory";
import { ticketCategorySchema } from "@/lib/validators";
import { errorJson, safeJson, slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "categories")) return errorJson("Forbidden", 403);
    const matchId = req.nextUrl.searchParams.get("matchId");
    const categories = await prisma.ticketCategory.findMany({
      where: matchId ? { matchId } : undefined,
      include: { match: true, zones: true, paymentLinks: true },
      orderBy: [{ matchId: "asc" }, { sortOrder: "asc" }],
    });
    return safeJson({
      categories: categories.map((c) => ({
        ...c,
        available: availableInventory(c.totalInventory, c.reservedCount, c.soldCount),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "categories")) return errorJson("Forbidden", 403);
    const body = await req.json();
    const parsed = ticketCategorySchema.safeParse(body);
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid", 400);

    const slug = parsed.data.slug || slugify(parsed.data.name);
    const category = await prisma.ticketCategory.create({
      data: {
        matchId: parsed.data.matchId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        totalInventory: parsed.data.totalInventory,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });
    await logAdminActivity(admin.id, "CREATE_CATEGORY", "ticket_category", category.id);
    return safeJson({ category }, 201);
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to create category", 500);
  }
}
