import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(function Textarea({ className, label, id, ...props }, ref) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      {label ? <span className="text-sm text-[var(--ink-muted)]">{label}</span> : null}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "w-full min-h-28 rounded-xl border border-[var(--line)] bg-black/40 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[var(--gold)]",
          className
        )}
        {...props}
      />
    </label>
  );
});
