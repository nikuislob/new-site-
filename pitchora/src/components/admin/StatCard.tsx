import { formatCurrency } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-2 font-display text-4xl text-[var(--gold)]">
        {typeof value === "number" && label.toLowerCase().includes("revenue")
          ? formatCurrency(value)
          : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--ink-muted)]">{hint}</p> : null}
    </div>
  );
}
