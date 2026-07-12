"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";

type Customer = {
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  lastOrderAt: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "spent" | "orders">("name");
  const [loading, setLoading] = useState(true);

  async function load(nextQ = q) {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    const res = await fetch(`/api/admin/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...customers].sort((a, b) => {
    if (sort === "spent") return b.spent - a.spent;
    if (sort === "orders") return b.orders - a.orders;
    return a.name.localeCompare(b.name);
  });

  function exportCsv() {
    const header = ["Name", "Email", "Phone", "Orders", "Spent", "Last Order"];
    const rows = sorted.map((c) => [c.name, c.email, c.phone, c.orders, c.spent, c.lastOrderAt]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pitchora-customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Customers</h1>
          <p className="text-[var(--ink-muted)]">Search, sort, and export customer records.</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <Input id="q" label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--ink-muted)]">Sort</span>
          <select
            className="w-full rounded-xl border border-[var(--line)] bg-black/40 px-4 py-3"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="name">Name</option>
            <option value="spent">Spent</option>
            <option value="orders">Orders</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button variant="gold" onClick={() => load()}>
            Search
          </Button>
        </div>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-[var(--ink-muted)]">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Orders</th>
                <th className="px-3 py-3">Spent</th>
                <th className="px-3 py-3">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.email} className="border-t border-[var(--line)]">
                  <td className="px-3 py-3">{c.name}</td>
                  <td className="px-3 py-3">{c.email}</td>
                  <td className="px-3 py-3">{c.phone}</td>
                  <td className="px-3 py-3">{c.orders}</td>
                  <td className="px-3 py-3">{formatCurrency(c.spent)}</td>
                  <td className="px-3 py-3">{new Date(c.lastOrderAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
