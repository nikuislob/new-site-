"use client";

import { FormEvent, useState } from "react";
import { formatMoney } from "@/lib/utils";

type Category = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

export function CategoriesAdmin({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: fd.get("name"),
        description: fd.get("description"),
        price: Number(fd.get("price")),
        color: fd.get("color"),
        isActive: fd.get("isActive") === "on",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setCategories((prev) => prev.map((c) => (c.id === id ? data.category : c)));
      setMessage("Category updated");
    } else {
      setMessage(data.error || "Update failed");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Ticket Categories</h1>
      <p className="text-sm text-[var(--ink-muted)]">Configure Basic ($70.50) and Premium ($141) pricing</p>
      {message && <p className="mt-3 text-sm text-[var(--pitch)]">{message}</p>}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {categories.map((cat) => (
          <form key={cat.id} onSubmit={(e) => save(e, cat.id)} className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-2xl tracking-[0.05em]">{cat.code}</p>
              <span className="text-sm font-bold" style={{ color: cat.color }}>
                {formatMoney(cat.price)}
              </span>
            </div>
            <div className="grid gap-3">
              <div className="field">
                <label>Name</label>
                <input name="name" defaultValue={cat.name} required />
              </div>
              <div className="field">
                <label>Price (USD)</label>
                <input name="price" type="number" step="0.01" defaultValue={cat.price} required />
              </div>
              <div className="field">
                <label>Color</label>
                <input name="color" defaultValue={cat.color} required />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea name="description" rows={3} defaultValue={cat.description || ""} />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" name="isActive" defaultChecked={cat.isActive} /> Active
              </label>
              <button type="submit" className="btn btn-primary w-fit">
                Save
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
