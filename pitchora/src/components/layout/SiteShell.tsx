import { Header } from "./Header";
import { Footer } from "./Footer";
import { prisma } from "@/lib/db";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer
        footerText={settings?.footerText}
        contactEmail={settings?.contactEmail}
        contactPhone={settings?.contactPhone}
      />
    </div>
  );
}
