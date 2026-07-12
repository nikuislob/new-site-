import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingClient } from "@/components/booking/BookingClient";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Seat Selection" };

export default async function BookPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return (
    <div className="container-page py-14">
      <Suspense fallback={<Spinner label="Preparing seat map..." />}>
        <BookingClient matchId={matchId} />
      </Suspense>
    </div>
  );
}
