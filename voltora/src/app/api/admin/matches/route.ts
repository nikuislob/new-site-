import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { matchSchema } from "@/lib/validators";
import { errorJson, safeJson, slugify } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) return errorJson("Forbidden", 403);
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: "asc" },
      include: {
        categories: true,
        _count: { select: { orders: true } },
      },
    });
    return safeJson({ matches });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to load matches", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "matches")) return errorJson("Forbidden", 403);
    const body = await req.json();
    const parsed = matchSchema.safeParse(body);
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message || "Invalid match", 400);

    const baseSlug = slugify(`${parsed.data.teamAName}-vs-${parsed.data.teamBName}`);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.match.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const match = await prisma.match.create({
      data: {
        slug,
        title: parsed.data.title,
        teamAName: parsed.data.teamAName,
        teamBName: parsed.data.teamBName,
        teamACode: parsed.data.teamACode.toUpperCase(),
        teamBCode: parsed.data.teamBCode.toUpperCase(),
        teamAFlagUrl: parsed.data.teamAFlagUrl || null,
        teamBFlagUrl: parsed.data.teamBFlagUrl || null,
        matchDate: new Date(parsed.data.matchDate),
        stadiumName: parsed.data.stadiumName,
        city: parsed.data.city,
        description: parsed.data.description || null,
        heroImageUrl: parsed.data.heroImageUrl || null,
        salesEnabled: parsed.data.salesEnabled ?? true,
        isSoldOut: parsed.data.isSoldOut ?? false,
        isFeatured: parsed.data.isFeatured ?? false,
        isActive: parsed.data.isActive ?? true,
      },
    });

    await logAdminActivity(admin.id, "CREATE_MATCH", "match", match.id);
    return safeJson({ match }, 201);
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to create match", 500);
  }
}
