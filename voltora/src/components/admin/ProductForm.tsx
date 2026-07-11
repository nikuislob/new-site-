"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { cn } from "@/lib/utils";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };

type Variant = {
  id?: string;
  name: string;
  sku: string;
  color?: string | null;
  storage?: string | null;
  priceModifier: number;
  stockQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
};

export type ProductFormData = {
  sku: string;
  name: string;
  brandId: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  specifications: Record<string, string>;
  mainImage: string;
  images: string[];
  originalPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  condition: "NEW" | "OPEN_BOX" | "REFURBISHED";
  deliveryEstimate: string;
  badges: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  variants: Variant[];
};

const emptyVariant = (): Variant => ({
  name: "",
  sku: "",
  color: "",
  storage: "",
  priceModifier: 0,
  stockQuantity: 0,
  imageUrl: "",
  isActive: true,
});

const defaultForm: ProductFormData = {
  sku: "",
  name: "",
  brandId: "",
  categoryId: "",
  shortDescription: "",
  fullDescription: "",
  specifications: {},
  mainImage: "",
  images: [],
  originalPrice: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  condition: "NEW",
  deliveryEstimate: "3-5 business days",
  badges: [],
  isFeatured: false,
  isTrending: false,
  isBestSeller: false,
  isNewArrival: false,
  isActive: true,
  variants: [],
};

type ProductFormProps = {
  productId?: string;
  initial?: Partial<ProductFormData>;
};

export function ProductForm({ productId, initial }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({ ...defaultForm, ...initial });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [badgeInput, setBadgeInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      const [b, c] = await Promise.all([
        adminFetch<{ brands: Brand[] }>("/api/admin/brands"),
        adminFetch<{ categories: Category[] }>("/api/admin/categories"),
      ]);
      setBrands(b.brands);
      setCategories(c.categories);
    }
    loadMeta().catch(() => {});
  }, []);

  const update = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleUpload(file: File, onUrl: (url: string) => void) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminFetch<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
      onUrl(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addSpec() {
    if (!specKey.trim()) return;
    update("specifications", { ...form.specifications, [specKey.trim()]: specValue.trim() });
    setSpecKey("");
    setSpecValue("");
  }

  function removeSpec(key: string) {
    const next = { ...form.specifications };
    delete next[key];
    update("specifications", next);
  }

  function addBadge() {
    if (!badgeInput.trim()) return;
    update("badges", [...form.badges, badgeInput.trim()]);
    setBadgeInput("");
  }

  function addImageUrl() {
    if (!imageUrl.trim()) return;
    const urls = [...form.images, imageUrl.trim()];
    update("images", urls);
    if (!form.mainImage) update("mainImage", imageUrl.trim());
    setImageUrl("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      ...form,
      images: form.images.length ? form.images : form.mainImage ? [form.mainImage] : [],
      variants: form.variants.length ? form.variants : undefined,
    };

    try {
      if (productId) {
        await adminFetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-white focus:border-[#00c2a8] focus:outline-none focus:ring-1 focus:ring-[#00c2a8]";
  const labelClass = "mb-1 block text-sm font-medium text-[#c5d0e0]";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sku" className={labelClass}>SKU *</label>
            <input id="sku" required value={form.sku} onChange={(e) => update("sku", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>Name *</label>
            <input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="brandId" className={labelClass}>Brand *</label>
            <select id="brandId" required value={form.brandId} onChange={(e) => update("brandId", e.target.value)} className={inputClass}>
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoryId" className={labelClass}>Category *</label>
            <select id="categoryId" required value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={inputClass}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shortDescription" className={labelClass}>Short description *</label>
            <textarea id="shortDescription" required rows={2} value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fullDescription" className={labelClass}>Full description *</label>
            <textarea id="fullDescription" required rows={5} value={form.fullDescription} onChange={(e) => update("fullDescription", e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Pricing & inventory</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="originalPrice" className={labelClass}>Original price *</label>
            <input id="originalPrice" type="number" min="0" step="0.01" required value={form.originalPrice || ""} onChange={(e) => update("originalPrice", parseFloat(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="sellingPrice" className={labelClass}>Selling price *</label>
            <input id="sellingPrice" type="number" min="0" step="0.01" required value={form.sellingPrice || ""} onChange={(e) => update("sellingPrice", parseFloat(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="stockQuantity" className={labelClass}>Stock *</label>
            <input id="stockQuantity" type="number" min="0" required value={form.stockQuantity} onChange={(e) => update("stockQuantity", parseInt(e.target.value, 10) || 0)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="condition" className={labelClass}>Condition</label>
            <select id="condition" value={form.condition} onChange={(e) => update("condition", e.target.value as ProductFormData["condition"])} className={inputClass}>
              <option value="NEW">New</option>
              <option value="OPEN_BOX">Open box</option>
              <option value="REFURBISHED">Refurbished</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="deliveryEstimate" className={labelClass}>Delivery estimate</label>
            <input id="deliveryEstimate" value={form.deliveryEstimate} onChange={(e) => update("deliveryEstimate", e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Images</h2>
        <div className="mb-4">
          <label htmlFor="mainImage" className={labelClass}>Main image URL *</label>
          <div className="flex gap-2">
            <input id="mainImage" required value={form.mainImage} onChange={(e) => update("mainImage", e.target.value)} className={inputClass} placeholder="https://…" />
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[#1e2d45] bg-[#0b1220] px-3 py-2 text-sm text-[#c5d0e0] hover:border-[#00c2a8]/40">
              <Upload className="h-4 w-4" aria-hidden />
              <span>{uploading ? "…" : "Upload"}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, (url) => update("mainImage", url)); }} />
            </label>
          </div>
          {form.mainImage ? (
            <img src={form.mainImage} alt="" className="mt-2 h-24 w-24 rounded-lg border border-[#1e2d45] object-cover" />
          ) : null}
        </div>
        <div>
          <label className={labelClass}>Additional images</label>
          <div className="flex gap-2">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass} placeholder="Image URL" />
            <button type="button" onClick={addImageUrl} className="shrink-0 rounded-lg bg-[#182338] px-3 py-2 text-sm text-white hover:bg-[#1e2d45]">Add</button>
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[#1e2d45] px-3 py-2 text-sm text-[#c5d0e0]">
              <Upload className="h-4 w-4" aria-hidden />
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, (url) => { const urls = [...form.images, url]; update("images", urls); }); }} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.images.map((url, i) => (
              <div key={url + i} className="relative">
                <img src={url} alt="" className="h-16 w-16 rounded-lg border border-[#1e2d45] object-cover" />
                <button type="button" aria-label="Remove image" onClick={() => update("images", form.images.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Specifications</h2>
        <div className="mb-3 flex gap-2">
          <input value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="Key" className={inputClass} />
          <input value={specValue} onChange={(e) => setSpecValue(e.target.value)} placeholder="Value" className={inputClass} />
          <button type="button" onClick={addSpec} className="shrink-0 rounded-lg bg-[#00c2a8] px-3 py-2 text-sm font-medium text-[#0b1220]">Add</button>
        </div>
        <ul className="space-y-1">
          {Object.entries(form.specifications).map(([k, v]) => (
            <li key={k} className="flex items-center justify-between rounded-lg bg-[#0b1220] px-3 py-2 text-sm">
              <span><span className="text-[#8b9cb8]">{k}:</span> {v}</span>
              <button type="button" onClick={() => removeSpec(k)} aria-label={`Remove ${k}`} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Badges & flags</h2>
        <div className="mb-4 flex gap-2">
          <input value={badgeInput} onChange={(e) => setBadgeInput(e.target.value)} placeholder="Badge label" className={inputClass} />
          <button type="button" onClick={addBadge} className="shrink-0 rounded-lg bg-[#182338] px-3 py-2 text-sm text-white">Add badge</button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {form.badges.map((b, i) => (
            <span key={b + i} className="inline-flex items-center gap-1 rounded-full bg-[#00c2a8]/15 px-3 py-1 text-xs text-[#00c2a8]">
              {b}
              <button type="button" onClick={() => update("badges", form.badges.filter((_, j) => j !== i))} aria-label={`Remove ${b}`}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {(["isFeatured", "isTrending", "isBestSeller", "isNewArrival", "isActive"] as const).map((flag) => (
            <label key={flag} className="flex items-center gap-2 text-sm text-[#c5d0e0]">
              <input type="checkbox" checked={form[flag]} onChange={(e) => update(flag, e.target.checked)} className="rounded border-[#1e2d45] accent-[#00c2a8]" />
              {flag.replace(/^is/, "").replace(/([A-Z])/g, " $1").trim()}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#1e2d45] bg-[#121a2b] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Variants</h2>
          <button type="button" onClick={() => update("variants", [...form.variants, emptyVariant()])} className="inline-flex items-center gap-1 rounded-lg bg-[#182338] px-3 py-1.5 text-sm text-[#00c2a8]">
            <Plus className="h-4 w-4" /> Add variant
          </button>
        </div>
        {form.variants.length === 0 ? (
          <p className="text-sm text-[#8b9cb8]">No variants. Product uses base SKU and stock.</p>
        ) : (
          <div className="space-y-4">
            {form.variants.map((v, i) => (
              <div key={i} className="rounded-lg border border-[#1e2d45] bg-[#0b1220] p-4">
                <div className="mb-3 flex justify-between">
                  <span className="text-sm font-medium text-[#c5d0e0]">Variant {i + 1}</span>
                  <button type="button" onClick={() => update("variants", form.variants.filter((_, j) => j !== i))} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input placeholder="Name *" required value={v.name} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, name: e.target.value }; update("variants", next); }} className={inputClass} />
                  <input placeholder="SKU *" required value={v.sku} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, sku: e.target.value }; update("variants", next); }} className={inputClass} />
                  <input placeholder="Color" value={v.color || ""} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, color: e.target.value }; update("variants", next); }} className={inputClass} />
                  <input placeholder="Storage" value={v.storage || ""} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, storage: e.target.value }; update("variants", next); }} className={inputClass} />
                  <input type="number" placeholder="Price modifier" value={v.priceModifier} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, priceModifier: parseFloat(e.target.value) || 0 }; update("variants", next); }} className={inputClass} />
                  <input type="number" min="0" placeholder="Stock *" required value={v.stockQuantity} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, stockQuantity: parseInt(e.target.value, 10) || 0 }; update("variants", next); }} className={inputClass} />
                  <input placeholder="Image URL" value={v.imageUrl || ""} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, imageUrl: e.target.value }; update("variants", next); }} className={cn(inputClass, "sm:col-span-2")} />
                  <label className="flex items-center gap-2 text-sm text-[#c5d0e0]">
                    <input type="checkbox" checked={v.isActive} onChange={(e) => { const next = [...form.variants]; next[i] = { ...v, isActive: e.target.checked }; update("variants", next); }} className="accent-[#00c2a8]" />
                    Active
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={loading || uploading} className="rounded-lg bg-[#00c2a8] px-6 py-2.5 text-sm font-semibold text-[#0b1220] hover:bg-[#00d4b8] disabled:opacity-60">
          {loading ? "Saving…" : productId ? "Update product" : "Create product"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-[#1e2d45] px-6 py-2.5 text-sm text-[#c5d0e0] hover:bg-[#182338]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function parseJsonField<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export function productToFormData(product: Record<string, unknown>): ProductFormData {
  return {
    sku: String(product.sku || ""),
    name: String(product.name || ""),
    brandId: String(product.brandId || ""),
    categoryId: String(product.categoryId || ""),
    shortDescription: String(product.shortDescription || ""),
    fullDescription: String(product.fullDescription || ""),
    specifications: parseJsonField(product.specifications as string, {}),
    mainImage: String(product.mainImage || ""),
    images: Array.isArray(product.images)
      ? (product.images as Array<{ url: string }>).map((i) => i.url)
      : [],
    originalPrice: Number(product.originalPrice) || 0,
    sellingPrice: Number(product.sellingPrice) || 0,
    stockQuantity: Number(product.stockQuantity) || 0,
    condition: (product.condition as ProductFormData["condition"]) || "NEW",
    deliveryEstimate: String(product.deliveryEstimate || "3-5 business days"),
    badges: parseJsonField(product.badges as string, []),
    isFeatured: Boolean(product.isFeatured),
    isTrending: Boolean(product.isTrending),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    isActive: product.isActive !== false,
    variants: Array.isArray(product.variants)
      ? (product.variants as Variant[]).map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          color: v.color,
          storage: v.storage,
          priceModifier: v.priceModifier ?? 0,
          stockQuantity: v.stockQuantity,
          imageUrl: v.imageUrl,
          isActive: v.isActive !== false,
        }))
      : [],
  };
}
