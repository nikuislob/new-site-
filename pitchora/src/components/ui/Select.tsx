import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(function Select({ className, label, id, children, ...props }, ref) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? <span className="text-sm text-[var(--ink-muted)]">{label}</span> : null}
      <select
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-xl border border-[var(--line)] bg-black/40 px-4 py-3 text-white outline-none focus:border-[var(--gold)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
});
