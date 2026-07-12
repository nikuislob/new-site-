import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { BulkRequestForm } from "@/components/booking/BulkRequestForm";

export const metadata: Metadata = { title: "Bulk Ticket Request" };

export default function BulkRequestPage() {
  return (
    <div className="container-page py-14">
      <PageHeader
        eyebrow="Groups"
        title="Bulk Ticket Request"
        description="Need 3 or more seats? Send a request straight to the admin dashboard."
      />
      <div className="max-w-2xl">
        <BulkRequestForm />
      </div>
    </div>
  );
}
