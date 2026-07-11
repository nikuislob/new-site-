"use client";

import { Truck } from "lucide-react";

interface AnnouncementBarProps {
  message: string;
  enabled?: boolean;
}

export function AnnouncementBar({ message, enabled = true }: AnnouncementBarProps) {
  if (!enabled || !message) return null;

  return (
    <div className="bg-[var(--bg)] text-[#e8f4ff]">
      <div className="container-page flex items-center justify-center gap-2 py-2.5 text-center text-xs font-medium sm:text-sm">
        <Truck className="hidden h-4 w-4 shrink-0 text-[var(--brand)] sm:block" aria-hidden />
        <p>{message}</p>
      </div>
    </div>
  );
}
