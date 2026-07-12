import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "PitchPass USA | International Football Tickets",
  description:
    "Secure upcoming international football match tickets for USA venues. Standard and Premium views with Apple Pay / Cash App payment links.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="min-h-[75vh]">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
