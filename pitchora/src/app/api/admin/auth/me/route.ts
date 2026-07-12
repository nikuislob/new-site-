import { getCurrentAdmin, publicAdmin } from "@/lib/auth";
import { errorJson, safeJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return errorJson("Unauthorized", 401);
  return safeJson({ admin: publicAdmin(admin) });
}
