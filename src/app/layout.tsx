import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenturne AI nastroje",
  description: "Internal AI tools for ad agency"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
