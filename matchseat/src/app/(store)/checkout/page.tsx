import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="container-page py-12">
      <h1 className="mb-2 font-display text-5xl font-bold">Checkout</h1>
      <p className="mb-8 text-[var(--ink-muted)]">
        Place your order, then pay the exact total via Cash App or Apple Pay. Orders stay pending until our team confirms payment.
      </p>
      <CheckoutForm />
    </div>
  );
}
