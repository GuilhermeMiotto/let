import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Particle Experience",
  description: "A cinematic particle experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
