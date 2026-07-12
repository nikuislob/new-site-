import type { Metadata } from "next";
import { CheckoutClient } from "@/components/booking/CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="container-page py-14 page-enter">
      <CheckoutClient />
    </div>
  );
}
