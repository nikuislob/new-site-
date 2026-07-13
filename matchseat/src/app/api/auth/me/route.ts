import { getCurrentCustomer, publicUser } from "@/lib/auth";
import { safeJson } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentCustomer();
  return safeJson({ user: user ? publicUser(user) : null });
}
