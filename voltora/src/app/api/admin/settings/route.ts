import { NextRequest } from "next/server";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { getSettings, setSettings } from "@/lib/settings";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const updateSchema = z.record(z.string(), z.string());

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "content")) return errorJson("Forbidden", 403);

    const settings = await getSettings();
    return safeJson({ settings });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to fetch settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "content")) return errorJson("Forbidden", 403);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    await setSettings(parsed.data);
    const settings = await getSettings();
    return safeJson({ settings });
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Failed to update settings", 500);
  }
}
