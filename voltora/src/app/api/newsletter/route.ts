import { NextRequest } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { parseJsonArray } from "@/lib/utils";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorJson("Valid email required", 400);

    const email = parsed.data.email.toLowerCase();
    const existing = parseJsonArray(await getSetting("newsletter_subscribers"));
    if (!existing.includes(email)) {
      existing.push(email);
      await setSetting("newsletter_subscribers", JSON.stringify(existing));
    }

    return safeJson({ success: true, message: "Subscribed successfully" });
  } catch {
    return errorJson("Subscription failed", 500);
  }
}
