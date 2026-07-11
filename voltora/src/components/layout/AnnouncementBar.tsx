"use client";

import { useEffect, useState } from "react";
import { Tag, X } from "lucide-react";

interface AnnouncementBarProps {
  message: string;
  enabled?: boolean;
  dismissible?: boolean;
  storageKey?: string;
}

export function AnnouncementBar({
  message,
  enabled = true,
  dismissible = true,
  storageKey = "voltora-announcement-dismissed",
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!dismissible) {
      setDismissed(false);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, [dismissible, storageKey]);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  if (!enabled || !message || dismissed) return null;

  return (
    <div className="announcement-bar relative border-b border-[var(--brand)]/20 bg-[#04241f] text-white">
      <div className="container-page flex items-center justify-center gap-2 py-1.5 pr-8 text-center">
        <Tag className="hidden h-3.5 w-3.5 shrink-0 text-[var(--brand)] sm:block" aria-hidden />
        <p className="text-[11px] font-medium leading-snug sm:text-xs">{message}</p>
        {dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
