import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="0.5"
          y="0.5"
          width="21"
          height="21"
          rx="6.5"
          fill="#1c1c1c"
          stroke="#1c1c1c"
        />
        <path
          d="M5.5 14.5L8.2 11.4L10.4 13.6L13.4 9.4L16.5 12.1"
          stroke="#f7f4ed"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13.4" cy="9.4" r="1.3" fill="#f7f4ed" />
      </svg>
      <span
        className="text-[15px] font-semibold tracking-[-0.02em]"
        style={{ color: "var(--color-ink)" }}
      >
        BetterLog
      </span>
    </span>
  );
}
