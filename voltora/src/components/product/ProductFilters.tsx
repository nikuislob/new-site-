"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface FilterBrand {
  id: string;
  name: string;
  slug: string;
}

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: FilterCategory[];
  brands: FilterBrand[];
}

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "OPEN_BOX", label: "Open box" },
  { value: "REFURBISHED", label: "Refurbished" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
  { value: "name", label: "Name A–Z" },
];

export function ProductFilters({ categories, brands }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  return (
    <aside className="card-surface p-4 lg:p-5 animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-[var(--brand)]" />
          Filters
        </h2>
        {pending ? <span className="text-xs text-[var(--ink-muted)]">Updating…</span> : null}
      </div>

      <div className="space-y-4">
        <Select
          label="Category"
          value={searchParams.get("category") || ""}
          onChange={(e) => updateParams({ category: e.target.value || null })}
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          placeholder="All categories"
        />

        <Select
          label="Brand"
          value={searchParams.get("brand") || ""}
          onChange={(e) => updateParams({ brand: e.target.value || null })}
          options={brands.map((b) => ({ value: b.slug, label: b.name }))}
          placeholder="All brands"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min price"
            type="number"
            min={0}
            placeholder="0"
            value={searchParams.get("minPrice") || ""}
            onChange={(e) => updateParams({ minPrice: e.target.value || null })}
          />
          <Input
            label="Max price"
            type="number"
            min={0}
            placeholder="Any"
            value={searchParams.get("maxPrice") || ""}
            onChange={(e) => updateParams({ maxPrice: e.target.value || null })}
          />
        </div>

        <Select
          label="Condition"
          value={searchParams.get("condition") || ""}
          onChange={(e) => updateParams({ condition: e.target.value || null })}
          options={CONDITIONS}
          placeholder="Any condition"
        />

        <Select
          label="Availability"
          value={searchParams.get("availability") || ""}
          onChange={(e) => updateParams({ availability: e.target.value || null })}
          options={[
            { value: "in_stock", label: "In stock" },
            { value: "out_of_stock", label: "Out of stock" },
          ]}
          placeholder="Any availability"
        />

        <Select
          label="Sort by"
          value={searchParams.get("sort") || "newest"}
          onChange={(e) => updateParams({ sort: e.target.value })}
          options={SORT_OPTIONS}
        />

        <Button variant="ghost" fullWidth onClick={clearFilters} className="text-sm">
          Clear filters
        </Button>
      </div>
    </aside>
  );
}
