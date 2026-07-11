import { cn } from "@/lib/utils";

type BadgeVariant = "order" | "payment" | "conversation" | "default";

const ORDER_STYLES: Record<string, string> = {
  ORDER_CREATED: "bg-slate-500/20 text-slate-300",
  PAYMENT_PENDING: "bg-amber-500/20 text-amber-300",
  PAYMENT_CONFIRMED: "bg-teal-500/20 text-teal-300",
  PROCESSING: "bg-blue-500/20 text-blue-300",
  SHIPPED: "bg-indigo-500/20 text-indigo-300",
  OUT_FOR_DELIVERY: "bg-violet-500/20 text-violet-300",
  DELIVERED: "bg-emerald-500/20 text-emerald-300",
  CANCELLED: "bg-red-500/20 text-red-300",
  REFUNDED: "bg-orange-500/20 text-orange-300",
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-300",
  CONFIRMED: "bg-emerald-500/20 text-emerald-300",
  FAILED: "bg-red-500/20 text-red-300",
  REFUNDED: "bg-orange-500/20 text-orange-300",
};

const CONVERSATION_STYLES: Record<string, string> = {
  OPEN: "bg-teal-500/20 text-teal-300",
  CLOSED: "bg-slate-500/20 text-slate-400",
};

const DEFAULT_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300",
  HIDDEN: "bg-slate-500/20 text-slate-400",
};

function formatLabel(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type StatusBadgeProps = {
  status: string;
  variant?: BadgeVariant;
  className?: string;
};

export function StatusBadge({ status, variant = "default", className }: StatusBadgeProps) {
  const styles =
    variant === "order"
      ? ORDER_STYLES[status]
      : variant === "payment"
        ? PAYMENT_STYLES[status]
        : variant === "conversation"
          ? CONVERSATION_STYLES[status]
          : DEFAULT_STYLES[status] || "bg-[#182338] text-[#c5d0e0]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles,
        className
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
