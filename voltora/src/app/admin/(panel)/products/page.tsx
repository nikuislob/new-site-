"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Copy, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Product = {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
  brand?: { name: string } | null;
  category?: { name: string } | null;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const data = await adminFetch<{ products: Product[] }>(`/api/admin/products?${params}`);
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(product: Product) {
    setActionId(product.id);
    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setActionId(null);
    }
  }

  async function duplicate(product: Product) {
    setActionId(product.id);
    try {
      const data = await adminFetch<{ product: { id: string } }>(
        `/api/admin/products/${product.id}?duplicate=1`,
        { method: "POST" }
      );
      router.push(`/admin/products/${data.product.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setActionId(null);
    }
  }

  async function remove(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setActionId(product.id);
    try {
      await adminFetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Products</h1>
          <p className="mt-1 text-sm text-[#8b9cb8]">Manage catalog items</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00c2a8] px-4 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8]"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7d9a]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full rounded-lg border border-[#1e2d45] bg-[#121a2b] py-2.5 pl-10 pr-3 text-sm text-white focus:border-[#00c2a8] focus:outline-none"
          />
        </div>
        <button type="submit" className="rounded-lg border border-[#1e2d45] bg-[#182338] px-4 py-2 text-sm text-white hover:border-[#00c2a8]/40">
          Search
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </div>
      ) : null}

      <DataTable
        loading={loading}
        data={products}
        keyExtractor={(p) => p.id}
        columns={[
          { key: "sku", header: "SKU", cell: (p) => <span className="font-mono text-xs">{p.sku}</span> },
          {
            key: "name",
            header: "Name",
            cell: (p) => (
              <Link href={`/admin/products/${p.id}`} className="font-medium text-[#00c2a8] hover:underline">
                {p.name}
              </Link>
            ),
          },
          { key: "brand", header: "Brand", cell: (p) => p.brand?.name || "—" },
          { key: "category", header: "Category", cell: (p) => p.category?.name || "—" },
          { key: "price", header: "Price", cell: (p) => formatCurrency(p.sellingPrice) },
          { key: "stock", header: "Stock", cell: (p) => p.stockQuantity },
          {
            key: "status",
            header: "Status",
            cell: (p) => (
              <StatusBadge status={p.isActive ? "ACTIVE" : "HIDDEN"} variant="default" />
            ),
          },
          {
            key: "actions",
            header: "Actions",
            className: "w-48",
            cell: (p) => (
              <div className="flex items-center gap-1">
                <Link href={`/admin/products/${p.id}`} className="rounded p-1.5 text-[#8b9cb8] hover:bg-[#182338] hover:text-white" title="Edit">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button type="button" disabled={actionId === p.id} onClick={() => toggleActive(p)} className="rounded p-1.5 text-[#8b9cb8] hover:bg-[#182338] hover:text-white" title={p.isActive ? "Hide" : "Activate"}>
                  {p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" disabled={actionId === p.id} onClick={() => duplicate(p)} className="rounded p-1.5 text-[#8b9cb8] hover:bg-[#182338] hover:text-white" title="Duplicate">
                  <Copy className="h-4 w-4" />
                </button>
                <button type="button" disabled={actionId === p.id} onClick={() => remove(p)} className="rounded p-1.5 text-red-400 hover:bg-red-500/10" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
