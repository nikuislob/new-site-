import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "PitchPass — World Cup 2026 tickets",
    template: "%s | PitchPass",
  },
  description:
    "Explore tickets for remaining FIFA World Cup 2026 matches with transparent pricing and order-linked support.",
  keywords: ["World Cup 2026 tickets", "football tickets", "PitchPass", "match tickets"],
  openGraph: {
    type: "website",
    siteName: "PitchPass",
    title: "PitchPass — Your Seat. Your Match. Your Moment.",
    description: "Tickets for the remaining FIFA World Cup 2026 matches.",
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchPass — World Cup 2026 tickets",
    description: "Tickets for the remaining FIFA World Cup 2026 matches.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
