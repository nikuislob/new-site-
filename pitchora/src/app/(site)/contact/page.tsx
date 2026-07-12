import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/booking/ContactForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });

  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Support"
        title="Contact"
        description="Reach the Pitchora team for booking help, bulk requests, or general questions."
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <ContactForm />
        <div className="glass rounded-[var(--radius)] p-6">
          <h2 className="font-display text-3xl">Direct channels</h2>
          <ul className="mt-4 space-y-3 text-[var(--ink-muted)]">
            <li>Email: {settings?.contactEmail}</li>
            <li>Phone: {settings?.contactPhone}</li>
            <li>Address: {settings?.contactAddress}</li>
            {settings?.whatsappUrl ? (
              <li>
                WhatsApp:{" "}
                <a className="text-[var(--gold)]" href={settings.whatsappUrl} target="_blank" rel="noreferrer">
                  Chat now
                </a>
              </li>
            ) : null}
          </ul>
          {settings?.liveChatEnabled ? (
            <p className="mt-6 text-sm text-[var(--emerald)]">Live chat intake is enabled via the contact form.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
