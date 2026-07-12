"use client";

import { ChatProvider } from "./ChatProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ChatProvider>{children}</ChatProvider>;
}
