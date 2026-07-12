import { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass rounded-[var(--radius)] px-6 py-14 text-center">
      <h3 className="font-display text-3xl tracking-wide">{title}</h3>
      {description ? <p className="mt-2 text-[var(--ink-muted)]">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 page-enter">
      {eyebrow ? <p className="mb-2 text-sm uppercase tracking-[0.25em] text-[var(--gold)]">{eyebrow}</p> : null}
      <h1 className="font-display text-5xl md:text-6xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">{description}</p> : null}
    </div>
  );
}

export function Notify({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "error" | "warn" }) {
  const tones = {
    info: "border-[var(--line)] bg-white/5",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    error: "border-red-500/40 bg-red-500/10 text-red-200",
    warn: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export { Button };
