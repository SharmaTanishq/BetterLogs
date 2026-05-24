import type { Metadata, Viewport } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "BetterLog — What happened to order #2847?",
  description:
    "Workflow observability + AI diagnosis for cross-system business processes. Get answers in seconds, not hours.",
  metadataBase: new URL("https://betterlog.dev"),
  openGraph: {
    title: "BetterLog — Workflow observability with AI diagnosis",
    description:
      "Drop in our SDK. We watch your workflows across every service. When something breaks, ask the AI agent what happened.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f4ed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
