"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatMoney } from "@/lib/utils";

type Payment = { id: string; provider: string; providerReference: string | null; idempotencyKey: string; status: string; amount: number; currency: string; errorMessage: string | null; createdAt: string; booking: { id: string; reference: string; customerEmail: string; match: { homeTeam: string; awayTeam: string } } };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { adminFetch<{ payments: Payment[]; cashAppConfigured: boolean }>("/api/admin/payments").then((data) => { setPayments(data.payments); setConfigured(data.cashAppConfigured); }).catch((cause) => setError(cause.message)); }, []);
  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold">Payments</h1><p className="mt-1 text-sm text-[#8b9cb8]">Provider status, references, errors, and verified totals.</p></div>
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${configured ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>{configured ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}<div><p className="font-semibold">Cash App {configured ? "configuration detected" : "requires configuration"}</p><p className="mt-1 text-xs opacity-75">{configured ? "Payment creation and signed webhook handling are enabled." : "Set CASH_APP_API_BASE_URL, CASH_APP_CREATE_PAYMENT_PATH, CASH_APP_API_KEY, and CASH_APP_WEBHOOK_SECRET using your provider documentation."}</p></div></div>
    {error ? <p className="text-red-300">{error}</p> : null}
    <div className="overflow-x-auto rounded-xl border border-[#20352d]"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-[#102b20] text-xs uppercase text-[#82978f]"><tr>{["Order","Match","Provider","Reference","Amount","Status","Created","Error"].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-t border-[#20352d] bg-[#0c2119]"><td className="px-4 py-3"><Link href={`/admin/bookings/${payment.booking.id}`} className="font-mono text-xs text-[#35e89b]">{payment.booking.reference}</Link></td><td className="px-4 py-3">{payment.booking.match.homeTeam} vs {payment.booking.match.awayTeam}</td><td className="px-4 py-3">{payment.provider.replaceAll("_"," ")}</td><td className="px-4 py-3 font-mono text-xs text-[#84988f]">{payment.providerReference || "—"}</td><td className="px-4 py-3">{formatMoney(payment.amount, payment.currency)}</td><td className="px-4 py-3">{payment.status}</td><td className="px-4 py-3 text-xs">{new Date(payment.createdAt).toLocaleString()}</td><td className="max-w-[220px] truncate px-4 py-3 text-xs text-red-300">{payment.errorMessage || "—"}</td></tr>)}</tbody></table></div>
  </div>;
}
