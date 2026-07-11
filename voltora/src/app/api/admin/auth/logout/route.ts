import { clearAdminSession, getCurrentAdmin, logAdminActivity } from "@/lib/auth";
import { safeJson } from "@/lib/utils";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (admin) {
    await logAdminActivity(admin.id, "logout", "admin", admin.id);
  }
  await clearAdminSession();
  return safeJson({ success: true });
}
