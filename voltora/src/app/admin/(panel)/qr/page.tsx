"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminQrPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = async (action: "validate" | "checkin") => {
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/qr/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Scan failed");
      return;
    }
    setResult(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">QR Management</h1>
      <p className="text-sm text-white/50">
        Paste a QR token (or URL path token) to validate or check in. Authorized staff only.
      </p>
      <div className="max-w-xl rounded-2xl border border-white/10 bg-[#0a1420] p-4">
        <Input
          label="QR token"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/^.*\//, ""))}
        />
        <div className="mt-4 flex gap-2">
          <Button onClick={() => scan("validate")}>Validate</Button>
          <Button variant="secondary" onClick={() => scan("checkin")}>
            Check In
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
        {result ? (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-white/80">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
