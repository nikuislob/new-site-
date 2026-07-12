import { prisma } from "@/lib/db";
import { safeJson } from "@/lib/utils";

/** Public active payment methods for checkout (no admin auth). */
export async function GET() {
  const paymentMethods = await prisma.paymentMethod.findMany({
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
  return safeJson({ paymentMethods });
}
