"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => setMethods(d.methods || []));
  }, []);

  const save = async () => {
    setMessage(null);
    const res = await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ methods }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setMethods(data.methods || methods);
    setMessage("Payment methods saved");
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Payments</h1>
      <p className="text-sm text-white/50">
        Customer-facing methods. Destination URLs are managed in Payment Links by category and quantity.
      </p>
      {methods.map((method, idx) => (
        <div key={method.id} className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Name"
              value={method.name}
              onChange={(e) =>
                setMethods((list) =>
                  list.map((m, i) => (i === idx ? { ...m, name: e.target.value } : m))
                )
              }
            />
            <Input
              label="Button text"
              value={method.buttonText}
              onChange={(e) =>
                setMethods((list) =>
                  list.map((m, i) => (i === idx ? { ...m, buttonText: e.target.value } : m))
                )
              }
            />
            <div className="md:col-span-2">
              <Textarea
                label="Instructions"
                value={method.instructions || ""}
                onChange={(e) =>
                  setMethods((list) =>
                    list.map((m, i) => (i === idx ? { ...m, instructions: e.target.value } : m))
                  )
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={method.isActive}
                onChange={(e) =>
                  setMethods((list) =>
                    list.map((m, i) => (i === idx ? { ...m, isActive: e.target.checked } : m))
                  )
                }
              />
              Active ({method.code})
            </label>
          </div>
        </div>
      ))}
      {message ? <p className="text-sm text-white/70">{message}</p> : null}
      <Button onClick={save}>Save Methods</Button>
    </div>
  );
}
