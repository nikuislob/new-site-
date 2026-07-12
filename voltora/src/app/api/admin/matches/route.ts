import { NextRequest } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { matchCreateSchema } from "@/lib/validators";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
    const matches = await prisma.match.findMany({ orderBy: { matchDate: "asc" } });
    return safeJson({ matches });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed to load matches", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = matchCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Invalid match data", 400);
    }

    const matchDate = new Date(parsed.data.matchDate);
    if (Number.isNaN(matchDate.getTime())) {
      return errorJson("Invalid match date", 400);
    }

    const match = await prisma.match.create({
      data: {
        homeTeam: parsed.data.homeTeam,
        awayTeam: parsed.data.awayTeam,
        venue: parsed.data.venue,
        stadiumViewUrl: parsed.data.stadiumViewUrl,
        matchDate,
        standardAvailable: parsed.data.standardAvailable,
        premiumAvailable: parsed.data.premiumAvailable,
      },
    });

    return safeJson({ match }, 201);
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    console.error(err);
    return errorJson("Failed to create match", 500);
  }
}
