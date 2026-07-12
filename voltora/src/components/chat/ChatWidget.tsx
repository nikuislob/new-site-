"use client";

import { FormEvent, useEffect, useState } from "react";

declare global {
  interface Window {
    pitchpassOpenChat?: (preset?: string) => void;
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    window.pitchpassOpenChat = (message?: string) => {
      setPreset(message || "I need help with bulk / group ticket purchasing.");
      setOpen(true);
      setSent(false);
    };
    return () => {
      delete window.pitchpassOpenChat;
    };
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-primary fixed bottom-5 right-5 z-50 shadow-lg"
        onClick={() => {
          setOpen(true);
          setSent(false);
        }}
      >
        Chat Now
      </button>

      {open ? (
        <div className="fixed bottom-24 right-5 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-lime-400/30 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between bg-emerald-900 px-4 py-3">
            <div>
              <div className="text-sm font-black text-lime-300">Live Desk</div>
              <div className="text-xs text-emerald-100/70">Bulk & group support</div>
            </div>
            <button type="button" className="text-sm text-white/70" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="space-y-3 p-4">
            {sent ? (
              <p className="text-sm text-emerald-300">
                Thanks — our bulk support desk received your request and will follow up shortly.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <textarea
                  className="input min-h-28"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  placeholder="Tell us about your group order..."
                  required
                />
                <button type="submit" className="btn btn-primary w-full">
                  Send to Bulk Support
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function openBulkChat() {
  if (typeof window !== "undefined") {
    window.pitchpassOpenChat?.(
      "Maximum of 2 tickets online — I need bulk / group ticket purchasing support."
    );
  }
}
