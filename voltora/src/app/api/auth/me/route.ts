import { getCurrentCustomer, publicUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getCurrentCustomer();
    if (!user) return errorJson("Unauthorized", 401);

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return safeJson({ user: publicUser(user), addresses });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch profile", 500);
  }
}
