import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/** Coral / modern-minimal — pill CTAs, coral fill primary, outlined secondary. */
const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium " +
  "border whitespace-nowrap transition-[box-shadow,transform,background-color,color,opacity] " +
  "duration-[var(--dur-short)] [transition-timing-function:var(--ease-out)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] " +
  "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none " +
  "rounded-[var(--radius-input)]";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-ink)] border-transparent hover:opacity-90",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-accent)]",
  ghost:
    "bg-transparent text-[var(--color-ink)] border-transparent hover:bg-[var(--color-paper-3)]",
  danger:
    "bg-[var(--color-alert)] text-[var(--color-accent-ink)] border-transparent hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] h-8 px-3.5",
  md: "text-[14px] h-10 px-4",
  lg: "text-[15px] h-11 px-5",
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
type AnchorProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" };

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(
  function Button(props, ref) {
    const { variant = "primary", size = "md", className, ...rest } = props as BaseProps & {
      as?: "a" | "button";
    } & Record<string, unknown>;
    const cls = cn(base, variants[variant], sizes[size], className);
    if ((props as AnchorProps).as === "a") {
      const { as: _as, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
        as?: "a";
      };
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cls}
          {...(anchorRest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }
    const { as: _as, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement> & {
      as?: "button";
    };
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cls}
        {...(buttonRest as ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  },
);
