import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Terms & Conditions" };
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  return (
    <div className="container-page py-14">
      <PageHeader eyebrow="Legal" title="Terms & Conditions" />
      <article className="glass prose-dark rounded-[var(--radius)] p-6 md:p-8">
        {settings?.termsAndConditions}
      </article>
    </div>
  );
}
