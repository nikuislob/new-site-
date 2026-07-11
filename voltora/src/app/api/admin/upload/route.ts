import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { requireAdmin, adminCan, AuthError } from "@/lib/auth";
import { safeJson, errorJson } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!adminCan(admin.role, "products")) return errorJson("Forbidden", 403);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorJson("No file provided", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorJson("Invalid file type. Allowed: JPEG, PNG, WebP, GIF", 400);
    }

    if (file.size > MAX_SIZE) {
      return errorJson("File too large. Maximum size is 5MB", 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${nanoid()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return safeJson({ url }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorJson(e.message, e.status);
    return errorJson("Upload failed", 500);
  }
}
