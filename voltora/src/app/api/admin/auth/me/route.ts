import { getCurrentAdmin, publicAdmin, AuthError } from "@/lib/auth";
import { safeJson, errorJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return errorJson("Unauthorized", 401);
    return safeJson({ admin: publicAdmin(admin) });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch admin", 500);
  }
}
