"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/AppProviders";

interface NewsletterFormProps {
  title?: string;
  description?: string;
}

export function NewsletterForm({
  title = "Stay in the loop",
  description = "Get product drops, deal alerts, and setup tips — no spam.",
}: NewsletterFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("You're subscribed!", "success");
      setEmail("");
    } catch {
      toast("Could not subscribe right now", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 sm:py-14">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[var(--radius)] bg-[var(--bg)] px-6 py-10 sm:px-10 sm:py-12 animate-fade-up">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--brand)]/15 blur-2xl" />
          <div className="absolute -bottom-8 left-10 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-2xl" />
          <div className="relative mx-auto max-w-xl text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[var(--brand)]">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-[#9fb0cb]">{description}</p>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
              <Button type="submit" loading={loading} className="shrink-0 sm:min-w-[140px]">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
