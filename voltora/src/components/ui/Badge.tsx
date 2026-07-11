import { cn } from "@/lib/utils";

type BadgeVariant = "trending" | "best" | "new" | "deal" | "featured" | "default";

const variantClass: Record<BadgeVariant, string> = {
  trending: "badge-trending",
  best: "badge-best",
  new: "badge-new",
  deal: "badge-deal",
  featured: "badge-featured",
  default: "bg-[var(--bg-soft)] text-[var(--ink-muted)]",
};

function resolveVariant(label: string): BadgeVariant {
  const normalized = label.toLowerCase();
  if (normalized.includes("trend")) return "trending";
  if (normalized.includes("best")) return "best";
  if (normalized.includes("new")) return "new";
  if (normalized.includes("deal") || normalized.includes("hot") || normalized.includes("sale")) return "deal";
  if (normalized.includes("featured")) return "featured";
  return "default";
}

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  const resolved = variant || resolveVariant(children);
  return <span className={cn("badge", variantClass[resolved], className)}>{children}</span>;
}
