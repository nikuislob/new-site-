import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        variant === "primary" &&
          "bg-[var(--emerald)] text-black hover:bg-[var(--emerald-deep)] shadow-[0_10px_30px_rgba(16,185,129,0.25)]",
        variant === "gold" &&
          "bg-[var(--gold)] text-black hover:brightness-110 shadow-[0_10px_30px_rgba(212,175,55,0.25)]",
        variant === "secondary" &&
          "glass text-white hover:bg-[var(--surface-strong)]",
        variant === "ghost" && "text-[var(--ink-muted)] hover:text-white hover:bg-white/5",
        variant === "danger" && "bg-[var(--danger)] text-white hover:brightness-110",
        className
      )}
      {...props}
    />
  );
});
