import { cn } from "@/lib/cn";

type SectionVariant = "default" | "void" | "inset";

interface SectionProps {
  id?: string;
  variant?: SectionVariant;
  className?: string;
  children: React.ReactNode;
  /** When false, skip the bottom border (e.g. last section before footer). */
  bordered?: boolean;
}

const variantBg: Record<SectionVariant, string> = {
  default: "bg-[var(--color-paper)]",
  void: "bg-[var(--color-void)]",
  inset: "bg-[var(--color-paper)]",
};

/**
 * Unified section shell — consistent max-width, horizontal inset, and vertical rhythm.
 */
export function Section({
  id,
  variant = "default",
  className,
  children,
  bordered = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        variantBg[variant],
        bordered && "border-b border-[var(--color-border)]",
        className,
      )}
    >
      <div
        className="mx-auto w-full max-w-[var(--container-content)] px-5 sm:px-8"
        style={{ paddingBlock: "var(--space-section)" }}
      >
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  /** Optional mono label — one per section max. */
  label?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  onDark?: boolean;
  className?: string;
}

/**
 * Split header grid used on every content section — title left, lede right.
 */
export function SectionHeader({
  label,
  title,
  description,
  onDark = false,
  className,
}: SectionHeaderProps) {
  const ink = onDark ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]";
  const muted = onDark ? "text-[var(--color-concrete)]/75" : "text-[var(--color-muted)]";
  const labelColor = onDark ? "text-[var(--color-concrete)]/60" : "text-[var(--color-muted)]";

  return (
    <header className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12", className)}>
      <div className="min-w-0">
        {label && (
          <p
            className={cn(
              "mb-4 font-mono text-[11px] uppercase tracking-[0.12em]",
              labelColor,
            )}
          >
            {label}
          </p>
        )}
        <h2
          className={cn(
            "font-display text-[var(--text-display)] leading-[1.04]",
            ink,
          )}
          style={{ overflowWrap: "anywhere" }}
        >
          {title}
        </h2>
      </div>
      {description && (
        <p className={cn("self-end text-[15px] leading-[1.55] lg:pt-1", muted)}>{description}</p>
      )}
    </header>
  );
}

interface PanelChromeProps {
  label: string;
  meta?: string;
  onDark?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Shared tile chrome for demo panels and code blocks. */
export function PanelChrome({
  label,
  meta,
  onDark = false,
  children,
  className,
}: PanelChromeProps) {
  const border = onDark ? "border-[var(--color-concrete)]/40" : "border-[var(--color-border)]";
  const ink = onDark ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]";
  const sub = onDark ? "text-[var(--color-concrete)]/60" : "text-[var(--color-muted)]";

  return (
    <div className={cn("overflow-clip rounded-[var(--radius-card)] border", border, className)}>
      <div className={cn("flex items-center justify-between border-b px-4 py-2.5 sm:px-5", border)}>
        <span className={cn("font-display text-[13px] uppercase tracking-[0.1em]", ink)}>
          {label}
        </span>
        {meta && <span className={cn("font-mono text-[10.5px]", sub)}>{meta}</span>}
      </div>
      {children}
    </div>
  );
}
