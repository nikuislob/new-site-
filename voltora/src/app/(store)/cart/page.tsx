import { CartView } from "@/components/cart/CartView";

export const metadata = {
  title: "Your Cart",
  description: "Review items in your Voltora cart.",
};

export default function CartPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-8 font-display text-3xl font-bold animate-fade-up">Shopping cart</h1>
      <CartView />
    </div>
  );
}
