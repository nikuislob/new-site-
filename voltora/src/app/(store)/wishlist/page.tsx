"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const [products, setProducts] = useState<Array<Parameters<typeof ProductCard>[0]["product"]>>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (res.status === 401) {
          setAuthRequired(true);
          return;
        }
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setProducts(data.products || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="container-page flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="container-page py-8 sm:py-12">
        <EmptyState
          icon={Heart}
          title="Sign in to view your wishlist"
          description="Save products you love and access them from any device."
          action={
            <Link href="/account/login?next=/wishlist">
              <Button>Sign in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-8 font-display text-3xl font-bold animate-fade-up">Wishlist</h1>
      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved items yet"
          description="Tap the heart on any product to save it here."
          action={
            <Link href="/products">
              <Button>Browse products</Button>
            </Link>
          }
        />
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showQuickAdd />
          ))}
        </div>
      )}
    </div>
  );
}
