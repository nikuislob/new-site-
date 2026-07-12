import { NextRequest } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { errorJson, safeJson } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorJson("File required", 400);

    const maxMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 5);
    if (file.size > maxMb * 1024 * 1024) {
      return errorJson(`File too large (max ${maxMb}MB)`, 400);
    }

    const ext = path.extname(file.name) || ".png";
    const name = `${nanoid(12)}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);
    return safeJson({ url: `/uploads/${name}` });
  } catch (err) {
    if (err instanceof AuthError) return errorJson(err.message, err.status);
    return errorJson("Upload failed", 500);
  }
}
