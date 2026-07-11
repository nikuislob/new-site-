import { clearCustomerSession } from "@/lib/auth";
import { safeJson } from "@/lib/utils";

export async function POST() {
  await clearCustomerSession();
  return safeJson({ success: true });
}
