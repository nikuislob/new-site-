import { Headphones, ShieldCheck, Truck } from "lucide-react";

interface WhyShopProps {
  title?: string;
  deliveryText?: string;
  supportText?: string;
  freeShippingThreshold?: string;
}

export function WhyShop({
  title = "Why shop Voltora",
  deliveryText,
  supportText,
  freeShippingThreshold = "75",
}: WhyShopProps) {
  const items = [
    {
      icon: Truck,
      title: "Fast US delivery",
      text: deliveryText || `Free shipping on orders over $${freeShippingThreshold}. Most in-stock items ship within 1 business day.`,
    },
    {
      icon: ShieldCheck,
      title: "Trusted checkout",
      text: "Transparent pricing, secure payment links, and clear order tracking from cart to delivery.",
    },
    {
      icon: Headphones,
      title: "Real support",
      text: supportText || "US-based customer support via live chat and email. We never ask for passwords or banking credentials.",
    },
  ];

  return (
    <section className="py-10 sm:py-14">
      <div className="container-page">
        <h2 className="mb-8 text-center font-display text-2xl font-bold sm:text-3xl animate-fade-up">
          {title}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.title}
              className="rounded-[var(--radius)] border border-[var(--line)] bg-white/80 p-6 text-center animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-deep)]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
