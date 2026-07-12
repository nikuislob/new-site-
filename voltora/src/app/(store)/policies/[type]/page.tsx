import { notFound } from "next/navigation";

const policies: Record<string, { title: string; intro: string; sections: [string, string][] }> = {
  privacy: {
    title: "Privacy policy",
    intro: "How PitchPass handles information needed to manage orders, payments, support, and ticket delivery.",
    sections: [
      ["Information we collect", "We collect account details, contact information, order selections, payment status and support messages. Payment credentials are processed by the selected provider and are not stored in PitchPass chat."],
      ["How we use information", "We use this information to reserve inventory, process and support orders, deliver tickets, prevent fraud, and meet legal obligations."],
      ["Your choices", "You may request access, correction, or deletion where applicable by contacting support. Order records may be retained when required for accounting, fraud prevention, or legal compliance."],
    ],
  },
  terms: {
    title: "Terms & conditions",
    intro: "The terms governing use of the PitchPass independent ticket marketplace.",
    sections: [
      ["Marketplace status", "PitchPass is an independent ticket marketplace and is not affiliated with or endorsed by FIFA. Venue and tournament names identify the relevant event only."],
      ["Orders and inventory", "A reservation is temporary until an order is created. Orders are confirmed only after payment is verified. Event information may update from the configured data provider without recreating your order."],
      ["Customer responsibilities", "Provide accurate contact and delivery details, review listing notes and restrictions, and do not share secure ticket files or access links."],
    ],
  },
  refunds: {
    title: "Refund & cancellation policy",
    intro: "How cancellations, event changes, and refund requests are handled.",
    sections: [
      ["Before payment", "Unpaid reservations and orders may expire or be cancelled without charge."],
      ["After payment", "Paid ticket orders are generally final unless the event is cancelled or applicable law requires otherwise. Postponed events remain valid for the rescheduled date unless stated otherwise."],
      ["Requesting help", "Contact support with your booking reference. Refund status is shown in your account and is never inferred from opening a payment link."],
    ],
  },
};

export default async function PolicyPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const policy = policies[type];
  if (!policy) notFound();
  return <div className="container-page py-16"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#17845f]">PitchPass legal</p><h1 className="mt-3 font-display text-5xl font-extrabold">{policy.title}</h1><p className="mt-5 text-lg leading-8 text-[var(--ink-muted)]">{policy.intro}</p><div className="mt-10 space-y-8">{policy.sections.map(([title, copy]) => <section key={title}><h2 className="font-display text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">{copy}</p></section>)}</div><p className="mt-12 text-xs text-[#82958d]">Last updated: July 12, 2026. Replace this starter policy with counsel-approved language before commercial launch.</p></div></div>;
}
