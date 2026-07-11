import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-white/70 px-6 py-14 text-center animate-fade-up",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-deep)]">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-display text-xl font-semibold text-[var(--ink)]">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-[var(--ink-muted)]">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
