import { getCurrentAdmin, publicAdmin } from "@/lib/auth";
import { safeJson } from "@/lib/utils";

export async function GET() {
  const admin = await getCurrentAdmin();
  return safeJson({ admin: admin ? publicAdmin(admin) : null });
}
