"use client";

import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">New product</h1>
        <p className="mt-1 text-sm text-[#8b9cb8]">Add a new item to the catalog</p>
      </div>
      <ProductForm />
    </div>
  );
}
