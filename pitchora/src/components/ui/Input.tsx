import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  function Input({ className, label, id, ...props }, ref) {
    return (
      <label className="block space-y-1.5" htmlFor={id}>
        {label ? <span className="text-sm text-[var(--ink-muted)]">{label}</span> : null}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-xl border border-[var(--line)] bg-black/40 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[var(--gold)]",
            className
          )}
          {...props}
        />
      </label>
    );
  }
);
