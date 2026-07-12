import { prisma } from "@/lib/db";
import { InquiriesAdmin } from "@/components/admin/InquiriesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <InquiriesAdmin
      initial={inquiries.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  );
}
