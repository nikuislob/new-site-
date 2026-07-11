import { NextRequest } from "next/server";
import { applyCoupon } from "@/lib/cart";
import { safeJson, errorJson } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorJson(parsed.error.issues[0]?.message || "Validation failed", 400);
    }

    const result = await applyCoupon(parsed.data.code, parsed.data.subtotal);
    return safeJson({ valid: true, discount: result.discount, coupon: result.coupon });
  } catch (e) {
    return errorJson(e instanceof Error ? e.message : "Invalid coupon", 400);
  }
}
