import crypto from "crypto";

const HOST = (process.env.GGUSONE_HOST || "https://www.ggusonepay.com").replace(/\/$/, "");
const MCH_NO = process.env.GGUSONE_MCH_NO || "";
const API_KEY = process.env.GGUSONE_KEY || "";

export type GgCreateResult = {
  ok: boolean;
  code?: number;
  msg?: string;
  payUrl?: string;
  tradeNo?: string;
  qrcode?: string;
  raw?: unknown;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Jeepay-style reqTime: yyyyMMddHHmmss in UTC */
export function formatReqTime(date = new Date()) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`
  );
}

/**
 * MD5 sign: sort keys ASCII, skip sign/signType/empty, join as k=v&..., append &key=SECRET, MD5 upper.
 */
export function ggSign(params: Record<string, unknown>, key = API_KEY): string {
  const keys = Object.keys(params)
    .filter((k) => {
      if (k === "sign" || k === "signType") return false;
      const v = params[k];
      return v !== undefined && v !== null && v !== "";
    })
    .sort();

  const str =
    keys
      .map((k) => {
        const v = params[k];
        const serialized = typeof v === "object" ? JSON.stringify(v) : String(v);
        return `${k}=${serialized}`;
      })
      .join("&") + `&key=${key}`;

  return crypto.createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

export function verifyGgSign(params: Record<string, unknown>, key = API_KEY): boolean {
  const incoming = String(params.sign || "").toUpperCase();
  if (!incoming || !key) return false;
  return ggSign(params, key) === incoming;
}

export function isGgConfigured() {
  return Boolean(MCH_NO && API_KEY);
}

/** Amount in cents (integer). $19.80 → 1980 */
export function toCents(dollars: number): number {
  return Math.round(Number(dollars) * 100);
}

/**
 * Create a payment order at ggusonepay.
 * wayCode examples: CASHAPP, GOOGLEPAY, APPLEPAY, CHIME (configured per merchant).
 */
export async function createGgPayment(input: {
  mchOrderNo: string;
  amountDollars: number;
  subject: string;
  wayCode: string;
  notifyUrl: string;
  returnUrl: string;
  clientIp?: string;
}): Promise<GgCreateResult> {
  if (!isGgConfigured()) {
    return { ok: false, msg: "Payment gateway is not configured" };
  }

  const params: Record<string, unknown> = {
    mchNo: MCH_NO,
    mchOrderNo: input.mchOrderNo,
    amount: toCents(input.amountDollars),
    currency: "usd",
    subject: input.subject.slice(0, 120),
    body: input.subject.slice(0, 120),
    wayCode: input.wayCode,
    notifyUrl: input.notifyUrl,
    returnUrl: input.returnUrl,
    clientIp: input.clientIp || "127.0.0.1",
    reqTime: formatReqTime(),
    version: "1.0",
  };

  params.sign = ggSign(params);
  params.signType = "MD5";

  try {
    const res = await fetch(`${HOST}/api/pay/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(params),
      cache: "no-store",
    });

    const raw = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!raw) return { ok: false, msg: "Invalid JSON from payment gateway", raw };

    const code = Number(raw.code);
    const data = (raw.data || {}) as Record<string, unknown>;
    const payUrl = String(data.payData || data.payUrl || data.payurl || raw.payurl || raw.payUrl || "");
    const qrcode = String(data.qrCode || data.qrcode || raw.qrcode || "");
    const tradeNo = String(data.payOrderId || data.tradeNo || data.trade_no || "");

    if (code === 0 || code === 1) {
      return {
        ok: true,
        code,
        msg: String(raw.msg || "OK"),
        payUrl: payUrl || undefined,
        qrcode: qrcode || undefined,
        tradeNo: tradeNo || undefined,
        raw,
      };
    }

    return {
      ok: false,
      code,
      msg: String(raw.msg || "Payment create failed"),
      payUrl: payUrl || undefined,
      tradeNo: tradeNo || undefined,
      raw,
    };
  } catch (e) {
    return { ok: false, msg: e instanceof Error ? e.message : "Payment network error" };
  }
}

/** Map admin payment method name → gateway wayCode */
export function wayCodeFromMethodName(name: string, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback.trim().toUpperCase();
  const n = name.toLowerCase();
  if (n.includes("cash")) return "CASHAPP";
  if (n.includes("google")) return "GOOGLEPAY";
  if (n.includes("apple")) return "APPLEPAY";
  if (n.includes("chime")) return "CHIME";
  if (n.includes("zelle")) return "ZELLE";
  if (n.includes("alipay")) return "ALI_QR";
  if (n.includes("wechat") || n.includes("wx")) return "WX_NATIVE";
  return name.replace(/\s+/g, "").toUpperCase();
}
