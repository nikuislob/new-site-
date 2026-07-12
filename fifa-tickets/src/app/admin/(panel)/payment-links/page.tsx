import { prisma } from "@/lib/db";
import { PaymentLinksAdmin } from "@/components/admin/PaymentLinksAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPaymentLinksPage() {
  const links = await prisma.paymentLink.findMany({ orderBy: { key: "asc" } });
  return <PaymentLinksAdmin initial={links} />;
}
