import { prisma } from "@/lib/db";
import { errorJson, safeJson } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const match = await prisma.match.findFirst({
    where: { slug, isPublished: true },
  });

  if (!match) return errorJson("Match not found.", 404);
  return safeJson({ match });
}
