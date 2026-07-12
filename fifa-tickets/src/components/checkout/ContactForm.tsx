"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";

type MatchOption = { id: string; slug: string; label: string };

export function ContactForm({ matches }: { matches: MatchOption[] }) {
  const searchParams = useSearchParams();
  const initialMatch = searchParams.get("match") || "";
  const initialQty = searchParams.get("qty") || "4";
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const matchSlug = String(fd.get("matchSlug") || "");
    const match = matches.find((m) => m.slug === matchSlug);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || null,
          matchId: match?.id || null,
          quantity: Number(fd.get("quantity") || 0) || null,
          message: fd.get("message"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Could not send inquiry");
      } else {
        setStatus("ok");
        setMessage("Thanks! Our bulk sales team will contact you shortly.");
        e.currentTarget.reset();
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-[var(--shadow)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--gold)] text-[#1a1505]">
          <MessageCircle size={20} />
        </span>
        <div>
          <h2 className="font-display text-3xl tracking-[0.05em] text-[var(--pitch-deep)]">Chat Now / Bulk Order</h2>
          <p className="text-sm text-[var(--ink-muted)]">For 3 or more tickets, submit this form and we will arrange group pricing.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" />
        </div>
        <div className="field">
          <label htmlFor="matchSlug">Match</label>
          <select id="matchSlug" name="matchSlug" defaultValue={initialMatch}>
            <option value="">General inquiry</option>
            {matches.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="quantity">Ticket quantity (3+)</label>
          <input id="quantity" name="quantity" type="number" min={3} max={100} defaultValue={initialQty} required />
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" rows={5} required placeholder="Tell us about your group, preferred sections, and any accessibility needs." />
        </div>
      </div>

      {status !== "idle" && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            status === "ok" ? "bg-[var(--pitch-soft)] text-[var(--pitch-deep)]" : "bg-[#fdecea] text-[var(--danger)]"
          }`}
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn btn-gold mt-6">
        {loading ? "Sending…" : "Submit Bulk Request"}
      </button>
    </form>
  );
}
