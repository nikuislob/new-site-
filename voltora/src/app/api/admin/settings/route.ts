import { NextRequest } from "next/server";
import { AuthError, adminCan, logAdminActivity, requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS, getSettings, setSettings } from "@/lib/settings";
import { errorJson, safeJson } from "@/lib/utils";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "settings") && admin.role !== "SUPER_ADMIN") {
      return errorJson("Forbidden", 403);
    }
    const settings = await getSettings(Object.keys(DEFAULT_SETTINGS));
    return safeJson({ settings });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "settings") && admin.role !== "SUPER_ADMIN") {
      return errorJson("Forbidden", 403);
    }
    const body = await req.json();
    const settings = body.settings as Record<string, string>;
    if (!settings || typeof settings !== "object") return errorJson("Invalid settings", 400);
    const filtered: Record<string, string> = {};
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (key in settings) filtered[key] = String(settings[key]);
    }
    await setSettings(filtered);
    await logAdminActivity(admin.id, "UPDATE_SETTINGS", "settings");
    return safeJson({ settings: await getSettings() });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Failed", 500);
  }
}
