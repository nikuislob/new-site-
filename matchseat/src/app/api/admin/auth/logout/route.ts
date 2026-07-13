import { clearAdminSession } from "@/lib/auth";
import { safeJson } from "@/lib/utils";

export async function POST() {
  await clearAdminSession();
  return safeJson({ ok: true });
}
