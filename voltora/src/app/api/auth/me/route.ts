import { getCurrentCustomer, publicUser } from "@/lib/auth";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentCustomer();
  if (!user) return errorJson("Unauthorized", 401);
  return safeJson({ user: publicUser(user) });
}
