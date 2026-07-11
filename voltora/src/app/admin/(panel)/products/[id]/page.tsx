"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm, productToFormData } from "@/components/admin/ProductForm";
import { adminFetch } from "@/lib/admin-fetch";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [initial, setInitial] = useState<ReturnType<typeof productToFormData> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminFetch<{ product: Record<string, unknown> }>(`/api/admin/products/${id}`);
        setInitial(productToFormData(data.product));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="text-[#8b9cb8]">Loading product…</p>;
  if (error) return <div className="text-red-300" role="alert">{error}</div>;
  if (!initial) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Edit product</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">{initial.name}</p>
      </div>
      <ProductForm productId={id} initial={initial} />
    </div>
  );
}
