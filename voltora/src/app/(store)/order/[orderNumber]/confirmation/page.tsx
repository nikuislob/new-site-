import { Suspense } from "react";
import ConfirmationClient from "./ConfirmationClient";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="container-page py-20"><div className="skeleton mx-auto h-64 max-w-xl" /></div>}>
      <ConfirmationClient />
    </Suspense>
  );
}
