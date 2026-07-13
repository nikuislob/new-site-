import { CartView } from "@/components/cart/CartView";

export default function CartPage() {
  return (
    <div className="container-page py-12">
      <h1 className="mb-8 font-display text-5xl font-bold">Your cart</h1>
      <CartView />
    </div>
  );
}
