import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header, type NavCategory } from "./Header";
import { SupportChat } from "@/components/support/SupportChat";

interface StoreShellProps {
  children: React.ReactNode;
  settings: Record<string, string>;
  categories: NavCategory[];
}

export function StoreShell({ children, settings, categories }: StoreShellProps) {
  const announcementEnabled = settings.announcement_enabled !== "false";
  const parentCategories = categories.filter((c) => !c.children || c.children.length >= 0);

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar message={settings.announcement_bar} enabled={announcementEnabled} />
      <Header storeName={settings.store_name} categories={parentCategories} />
      <main className="flex-1">{children}</main>
      <Footer
        storeName={settings.store_name}
        about={settings.footer_about}
        contactEmail={settings.contact_email}
        contactPhone={settings.contact_phone}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
      />
      <SupportChat />
    </div>
  );
}
