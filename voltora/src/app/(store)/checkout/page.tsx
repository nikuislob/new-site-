import { redirect } from "next/navigation";
import { TicketCheckout } from "@/components/checkout/TicketCheckout";

export const metadata = { title: "Secure checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ reservation?: string }> }) {
  const { reservation } = await searchParams;
  if (!reservation) redirect("/#matches");
  return <TicketCheckout token={reservation} />;
}
