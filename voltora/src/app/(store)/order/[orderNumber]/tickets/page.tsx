import { Suspense } from "react";
import TicketsClient from "./TicketsClient";

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="container-page py-20"><div className="skeleton mx-auto h-72 max-w-lg" /></div>}>
      <TicketsClient />
    </Suspense>
  );
}
