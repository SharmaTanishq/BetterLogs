"use client";

import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  /** Size in px for the wordmark height. Underscore caret tracks font size. */
  size?: number;
  /** When true, show the trailing blinking caret. Hero contexts only. */
  caret?: boolean;
  /** Render on dark surfaces (void) — flips the ink color. */
  onDark?: boolean;
}

export function Logo({ className, size = 22, caret = false, onDark = false }: LogoProps) {
  const color = onDark ? "var(--color-paper)" : "var(--color-foreground)";
  return (
    <span
      className={cn(
        "font-display inline-flex select-none items-baseline tracking-[-0.025em]",
        className,
      )}
      style={{ color, fontWeight: 700, fontSize: `${size}px`, lineHeight: 1 }}
    >
      <span>BetterLog</span>
      <span aria-hidden style={{ marginLeft: "0.05em" }}>
        {caret ? <Caret color={color} /> : "_"}
      </span>
    </span>
  );
}

function Caret({ color }: { color: string }) {
  return (
    <span
      className="inline-block align-baseline"
      style={{
        width: "0.6ch",
        height: "0.78em",
        background: color,
        animation: "caret-blink 1.05s steps(1) infinite",
        verticalAlign: "-0.06em",
      }}
    />
  );
}
