import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Radar - Real-time AI Intelligence Dashboard",
  description: "Track AI trends, signals, and expert insights from multiple sources in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
