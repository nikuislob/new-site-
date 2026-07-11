"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn("input", error && "border-[var(--danger)]", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error ? (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-[var(--ink-muted)]">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
