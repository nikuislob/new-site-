import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { availableInventory } from "@/lib/inventory";
import { ticketCategorySchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "categories")) return errorJson("Forbidden", 403);
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = ticketCategorySchema.partial().omit({ matchId: true }).safeParse(body);
    if (!parsed.success) return errorJson("Invalid data", 400);

    const existing = await prisma.ticketCategory.findUnique({ where: { id } });
    if (!existing) return errorJson("Not found", 404);

    if (parsed.data.totalInventory !== undefined) {
      const used = existing.reservedCount + existing.soldCount;
      if (parsed.data.totalInventory < used) {
        return errorJson(
          `Total inventory cannot be below reserved+sold (${used})`,
          400
        );
      }
    }

    const category = await prisma.ticketCategory.update({
      where: { id },
      data: parsed.data,
    });

    await logAdminActivity(admin.id, "UPDATE_CATEGORY", "ticket_category", id);
    return safeJson({
      category: {
        ...category,
        available: availableInventory(
          category.totalInventory,
          category.reservedCount,
          category.soldCount
        ),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
