"use client";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-[var(--ink-muted)]" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}
