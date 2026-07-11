import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { absoluteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Voltora — Premium US Electronics",
    template: "%s | Voltora",
  },
  description:
    "Shop trending smartphones, laptops, audio, gaming, and smart home gear. Premium electronics delivered across the United States.",
  keywords: ["electronics", "smartphones", "laptops", "US store", "Voltora", "premium tech"],
  openGraph: {
    type: "website",
    siteName: "Voltora",
    title: "Voltora — Premium US Electronics",
    description: "Premium electronics. Delivered.",
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Voltora — Premium US Electronics",
    description: "Premium electronics. Delivered.",
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
