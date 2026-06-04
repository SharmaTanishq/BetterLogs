import type { Metadata, Viewport } from "next";
import { Inter_Tight, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-inter-tight",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "BetterLog: Case-level workflow diagnosis",
  description:
    "Engineers declare workflow shape with an explicit SDK contract. BetterLog stitches OpenTelemetry spans into named workflows keyed to business identifiers, with plain-language root cause for engineers and ops.",
  metadataBase: new URL("https://betterlog.dev"),
  openGraph: {
    title: "BetterLog: Case-level workflow diagnosis",
    description:
      "OTel-native workflow diagnosis. Answer what happened to order-1234 without reading raw traces, for engineers and ops alike.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
