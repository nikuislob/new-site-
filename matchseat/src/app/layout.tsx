import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchPass — US Match Tickets",
  description:
    "Buy Basic ($70) and Premium ($140) seats for upcoming international soccer matches in the United States. Cash App & Apple Pay checkout.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
