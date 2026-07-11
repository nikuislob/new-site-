import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5 shadow-sm transition-colors hover:border-[#00c2a8]/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#8b9cb8]">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-white">{value}</p>
          {hint ? <p className="mt-1 text-xs text-[#6b7d9a]">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00c2a8]/10 text-[#00c2a8]">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  );
}
