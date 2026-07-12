import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SupportChat } from "@/components/support/SupportChat";
import { getSetting } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const disclaimer = await getSetting("footer_disclaimer");
  const announcement = await getSetting("announcement");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      {announcement ? (
        <div className="border-b border-white/10 bg-[#081018] px-4 py-2 text-center text-xs text-white/65">
          {announcement}
        </div>
      ) : null}
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter disclaimer={disclaimer} />
      <SupportChat />
    </div>
  );
}
