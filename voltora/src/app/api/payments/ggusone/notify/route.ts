import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyGgSign } from "@/lib/ggusone";

/**
 * Async notify from ggusonepay.
 * Only marks Payment Confirmed when signature verifies and state is success.
 * Opening a payment link alone never hits this route.
 */
export async function POST(req: NextRequest) {
  return handleNotify(req);
}

export async function GET(req: NextRequest) {
  return handleNotify(req);
}

async function handleNotify(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let params: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      params = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    } else {
      const form = await req.formData().catch(() => null);
      if (form) {
        form.forEach((v, k) => {
          params[k] = String(v);
        });
      } else {
        req.nextUrl.searchParams.forEach((v, k) => {
          params[k] = v;
        });
      }
    }

    // Nested data object support
    if (params.data && typeof params.data === "object") {
      params = { ...params, ...(params.data as Record<string, unknown>) };
    }

    if (!verifyGgSign(params)) {
      return new Response("fail", { status: 400 });
    }

    const state = String(params.state ?? params.trade_status ?? params.status ?? "");
    const success =
      state === "2" ||
      state === "SUCCESS" ||
      state === "TRADE_SUCCESS" ||
      state === "1" ||
      Number(params.state) === 2;

    const mchOrderNo = String(params.mchOrderNo || params.out_trade_no || "");
    if (!mchOrderNo) return new Response("fail", { status: 400 });

    const order = await prisma.order.findFirst({ where: { orderNumber: mchOrderNo } });
    if (!order) return new Response("fail", { status: 404 });

    if (success && order.paymentStatus === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "CONFIRMED",
          status: "PAYMENT_CONFIRMED",
          adminNotes: [
            order.adminNotes,
            `Auto-confirmed via ggusonepay notify at ${new Date().toISOString()}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });
    }

    // Jeepay expects "success" plain text
    return new Response("success", { status: 200 });
  } catch {
    return new Response("fail", { status: 500 });
  }
}
