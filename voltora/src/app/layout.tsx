import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: {
    default: "Arena Nights — Championship Tickets",
    template: "%s · Arena Nights",
  },
  description:
    "Secure your seats for the Arena Nights International Championship Final. Premium stadium experience with interactive seating and digital QR passes.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
