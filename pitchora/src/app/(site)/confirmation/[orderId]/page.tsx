import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationClient } from "@/components/booking/ConfirmationClient";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Order Confirmation" };

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <div className="container-page py-14">
      <Suspense fallback={<Spinner label="Loading ticket..." />}>
        <ConfirmationClient orderId={orderId} />
      </Suspense>
    </div>
  );
}
