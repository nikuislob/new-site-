import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { StoreShell } from "@/components/layout/StoreShell";
import type { NavCategory } from "@/components/layout/Header";

async function getNavCategories(): Promise<NavCategory[]> {
  const parents = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return parents.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    children: p.children.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
  }));
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSettings([
      "store_name",
      "announcement_bar",
      "announcement_enabled",
      "footer_about",
      "contact_email",
      "contact_phone",
    ]),
    getNavCategories(),
  ]);

  return (
    <StoreShell settings={settings} categories={categories}>
      {children}
    </StoreShell>
  );
}
