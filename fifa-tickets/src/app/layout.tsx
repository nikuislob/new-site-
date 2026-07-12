import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FIFA Match Tickets",
    template: "%s | FIFA Match Tickets",
  },
  description:
    "Official-style FIFA match ticket sales with interactive seat selection, secure checkout, and Apple Pay / Cash App payment redirects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
