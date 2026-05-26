import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "@xyflow/react/dist/style.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
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
  title: "BetterLog_ — AI-powered workflow diagnosis",
  description:
    "Root cause. Context. Action. BetterLog maps OpenTelemetry traces onto named business workflows so engineers and ops teams share one explanation of what failed and what to do next.",
  metadataBase: new URL("https://betterlog.dev"),
  openGraph: {
    title: "BetterLog — AI-powered workflow diagnosis",
    description:
      "OTel-native workflow diagnosis. Translate distributed trace failures into plain-language root cause analyses both engineers and ops can read.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F2EE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
