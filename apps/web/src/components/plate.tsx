import { cn } from "@/lib/cn";

interface PlateHeaderProps {
  /** Mono plate number, e.g. "003" */
  n: string;
  /** UPPERCASE eyebrow label */
  label: string;
  /** Optional sub-label rendered after the main label */
  meta?: string;
  className?: string;
  onDark?: boolean;
}

/**
 * The brutalist plate header. Renders as a top-left anchored marker:
 *   003   FEATURE_NAME    meta line ...........................
 *
 * Used at the top of every section block.
 */
export function PlateHeader({ n, label, meta, className, onDark = false }: PlateHeaderProps) {
  const ink = onDark ? "text-[var(--color-paper)]" : "text-[var(--color-foreground)]";
  const sub = onDark ? "text-[var(--color-concrete)]/60" : "text-[var(--color-foreground-subtle)]";
  const rule = onDark ? "bg-[var(--color-concrete)]/30" : "bg-[var(--color-foreground)]/20";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("font-mono text-[12px]", ink)}>{n}</span>
      <span className={cn("font-mono text-[12px] uppercase tracking-[0.12em]", ink)}>
        {label}
      </span>
      <span className={cn("h-px flex-1", rule)} aria-hidden />
      {meta && <span className={cn("font-mono text-[11px]", sub)}>{meta}</span>}
    </div>
  );
}
