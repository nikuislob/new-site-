"use client";

import { FormEvent, useState } from "react";
import { formatMoney } from "@/lib/utils";

type LinkRow = {
  id: string;
  key: string;
  label: string;
  amount: number;
  url: string;
  provider: string;
  isActive: boolean;
};

export function PaymentLinksAdmin({ initial }: { initial: LinkRow[] }) {
  const [links, setLinks] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>, key: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/payment-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        url: fd.get("url"),
        isActive: fd.get("isActive") === "on",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setLinks((prev) => prev.map((l) => (l.key === key ? data.link : l)));
      setMessage(`Updated ${key}`);
    } else {
      setMessage(data.error || "Update failed");
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-[0.06em] text-[var(--pitch-deep)]">Payment Links</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--ink-muted)]">
        Map each package to an Apple Pay / Cash App URL. Checkout redirects automatically based on category and quantity.
      </p>
      {message && <p className="mt-3 text-sm text-[var(--pitch)]">{message}</p>}

      <div className="mt-6 grid gap-4">
        {links.map((link) => (
          <form
            key={link.key}
            onSubmit={(e) => save(e, link.key)}
            className="rounded-2xl bg-white p-5 shadow-sm sm:flex sm:items-end sm:gap-4"
          >
            <div className="min-w-[180px]">
              <p className="font-display text-2xl tracking-[0.05em]">{link.key}</p>
              <p className="text-sm text-[var(--ink-muted)]">{link.label}</p>
              <p className="mt-1 font-bold text-[var(--pitch)]">{formatMoney(link.amount)}</p>
            </div>
            <div className="field mt-3 flex-1 sm:mt-0">
              <label>Payment URL (Apple Pay / Cash App)</label>
              <input name="url" defaultValue={link.url} required />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-semibold sm:mt-0 sm:mb-2">
              <input type="checkbox" name="isActive" defaultChecked={link.isActive} /> Active
            </label>
            <button type="submit" className="btn btn-primary mt-3 sm:mt-0 sm:mb-0.5">
              Save
            </button>
          </form>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--pitch-soft)] p-5 text-sm text-[var(--pitch-deep)]">
        <p className="font-bold">Redirect rules</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>1 Basic → BASIC_1 ($70.50)</li>
          <li>2 Basic → BASIC_2 ($141)</li>
          <li>1 Premium → PREMIUM_1 ($141)</li>
          <li>2 Premium → PREMIUM_2 ($282)</li>
          <li>3+ tickets → Chat Now / contact form (no online payment redirect)</li>
        </ul>
      </div>
    </div>
  );
}
