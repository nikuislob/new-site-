import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils";

export async function GET() {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      iconUrl: true,
      buttonText: true,
      instructions: true,
    },
  });
  return safeJson({ methods });
}
