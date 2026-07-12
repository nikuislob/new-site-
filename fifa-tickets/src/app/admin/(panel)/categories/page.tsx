import { prisma } from "@/lib/db";
import { CategoriesAdmin } from "@/components/admin/CategoriesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.ticketCategory.findMany({ orderBy: { sortOrder: "asc" } });
  return <CategoriesAdmin initial={categories} />;
}
