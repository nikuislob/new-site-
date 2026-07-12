import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-next",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body-next",
});

export const metadata: Metadata = {
  title: {
    default: "Pitchora | Premium Football Ticket Booking",
    template: "%s | Pitchora",
  },
  description:
    "Book premium football tickets with interactive seat maps, live countdowns, and secure Apple Pay or Cash App checkout.",
  keywords: ["football tickets", "stadium seats", "match tickets", "Pitchora"],
  openGraph: {
    title: "Pitchora | Premium Football Ticket Booking",
    description: "Luxury sports ticketing for upcoming football matches worldwide.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
