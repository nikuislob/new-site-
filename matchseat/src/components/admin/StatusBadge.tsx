import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status?: string | null;
  type?: "order" | "payment" | "conversation";
};

const statusClass: Record<string, string> = {
  PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  PAID: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  FULFILLED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  OPEN: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  PAYMENT_PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  PROCESSING: "bg-sky-100 text-sky-800 ring-sky-200",
  CLOSED: "bg-slate-200 text-slate-700 ring-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 ring-rose-200",
  FAILED: "bg-rose-100 text-rose-800 ring-rose-200",
  REFUNDED: "bg-slate-200 text-slate-700 ring-slate-300",
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const normalized = (status || "UNKNOWN").toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ring-1",
        statusClass[normalized] || "bg-slate-100 text-slate-700 ring-slate-200"
      )}
      title={type ? `${type} status` : undefined}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
