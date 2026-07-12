import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Privacy Policy" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  return (
    <div className="container-page py-14">
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <article className="glass prose-dark rounded-[var(--radius)] p-6 md:p-8">
        {settings?.privacyPolicy}
      </article>
    </div>
  );
}
