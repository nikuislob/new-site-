"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Notify } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

type MatchOption = { id: string; label: string };

function BulkFormInner() {
  const searchParams = useSearchParams();
  const presetMatch = searchParams.get("matchId") || "";
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState("https://wa.me/15550142200");

  useEffect(() => {
    Promise.all([fetch("/api/matches"), fetch("/api/settings/public")])
      .then(async ([m, s]) => {
        const mj = await m.json();
        const sj = await s.json();
        setMatches(
          (mj.matches || []).map(
            (match: {
              id: string;
              homeTeam: { name: string };
              awayTeam: { name: string };
            }) => ({
              id: match.id,
              label: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
            })
          )
        );
        if (sj.settings?.whatsappUrl) setWhatsapp(sj.settings.whatsappUrl);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const matchId = String(fd.get("matchId") || "");
    const matchLabel = matches.find((m) => m.id === matchId)?.label;
    try {
      const res = await fetch("/api/bulk-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          matchId: matchId || undefined,
          matchLabel,
          quantity: Number(fd.get("quantity")),
          message: fd.get("message") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus("ok");
      setMessage("Bulk request submitted to the admin dashboard.");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Notify tone="warn">
        For bookings of 3 or more tickets, please contact our support team. Online checkout is disabled above 2
        tickets.
      </Notify>
      <div className="flex flex-wrap gap-3">
        <Link href="/contact">
          <Button variant="secondary" size="sm">Live Chat / Contact</Button>
        </Link>
        <a href={whatsapp} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">WhatsApp</Button>
        </a>
      </div>
      <form onSubmit={onSubmit} className="glass space-y-4 rounded-[var(--radius)] p-6">
        {status !== "idle" ? <Notify tone={status === "ok" ? "success" : "error"}>{message}</Notify> : null}
        <Input id="name" name="name" label="Name" required />
        <Input id="email" name="email" type="email" label="Email" required />
        <Input id="phone" name="phone" label="Phone" required />
        <Select id="matchId" name="matchId" label="Match" defaultValue={presetMatch}>
          <option value="">Select a match</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <Input id="quantity" name="quantity" type="number" min={3} max={100} label="Requested quantity" required defaultValue={3} />
        <Textarea id="message" name="message" label="Message" />
        <Button type="submit" variant="gold" disabled={loading}>
          {loading ? "Submitting..." : "Submit Bulk Request"}
        </Button>
      </form>
    </div>
  );
}

export function BulkRequestForm() {
  return (
    <Suspense fallback={<Spinner label="Loading form..." />}>
      <BulkFormInner />
    </Suspense>
  );
}
