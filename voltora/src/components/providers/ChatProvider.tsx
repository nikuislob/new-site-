"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  prefill: { tag?: string; message?: string; subject?: string } | null;
  openWithContext: (ctx: { tag?: string; message?: string; subject?: string }) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<ChatContextValue["prefill"]>(null);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      prefill,
      openWithContext: (ctx: { tag?: string; message?: string; subject?: string }) => {
        setPrefill(ctx);
        setOpen(true);
      },
    }),
    [open, prefill]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
