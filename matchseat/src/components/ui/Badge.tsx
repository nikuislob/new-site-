import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand-deep)]",
        className
      )}
    >
      {children}
    </span>
  );
}
