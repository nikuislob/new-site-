import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured");

  const matches = await prisma.match.findMany({
    where: {
      isPublished: true,
      ...(featured === "1" ? { isFeatured: true } : {}),
    },
    orderBy: { kickoffAt: "asc" },
  });

  return safeJson({ matches });
}
