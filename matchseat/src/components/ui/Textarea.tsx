import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const tid = id || props.name;
  return (
    <label className="grid gap-1.5 text-sm">
      {label ? <span className="font-medium text-[var(--ink)]">{label}</span> : null}
      <textarea
        id={tid}
        className={cn(
          "min-h-[100px] rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-[var(--ink)] outline-none focus:border-[var(--brand)]",
          className
        )}
        {...props}
      />
    </label>
  );
}
