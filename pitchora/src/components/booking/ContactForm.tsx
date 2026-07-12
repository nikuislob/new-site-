"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Notify } from "@/components/ui/PageHeader";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || undefined,
          subject: fd.get("subject"),
          message: fd.get("message"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus("ok");
      setMessage("Message sent. Our team will reply shortly.");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-[var(--radius)] p-6">
      {status !== "idle" ? <Notify tone={status === "ok" ? "success" : "error"}>{message}</Notify> : null}
      <Input id="name" name="name" label="Name" required />
      <Input id="email" name="email" type="email" label="Email" required />
      <Input id="phone" name="phone" label="Phone" />
      <Input id="subject" name="subject" label="Subject" required />
      <Textarea id="message" name="message" label="Message" required />
      <Button type="submit" variant="gold" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
