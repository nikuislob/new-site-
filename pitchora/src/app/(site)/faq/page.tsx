import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db";
import { parseFaq } from "@/lib/utils";

export const metadata: Metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const faq = parseFaq(settings?.faqJson);

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Help"
        title="FAQ"
        description="Answers about ticket limits, payments, seats, and match updates."
      />
      <div className="space-y-4">
        {faq.map((item) => (
          <details key={item.question} className="glass group rounded-[var(--radius)] px-5 py-4">
            <summary className="cursor-pointer list-none font-semibold marker:content-none">
              {item.question}
            </summary>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
