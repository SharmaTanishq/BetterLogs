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

/**
 * Brutalist button. Rectangular, 1px black border, no soft shadow.
 * Hover = hard 1px black outer ring (snap). Press = inset 1px ring + 1px translateY.
 * Use `as="a"` to render an anchor.
 */
const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium " +
  "border whitespace-nowrap transition-[box-shadow,transform,background-color,color] " +
  "duration-[var(--motion-base)] [transition-timing-function:var(--ease-snap)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] " +
  "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-signal)] text-white border-[var(--color-foreground)] hover:shadow-[0_0_0_1px_var(--color-foreground)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-foreground)] hover:shadow-[0_0_0_1px_var(--color-foreground)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] border-transparent hover:border-[var(--color-foreground)]",
  danger:
    "bg-[var(--color-alert)] text-white border-[var(--color-foreground)] hover:shadow-[0_0_0_1px_var(--color-foreground)]",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] h-8 px-3 rounded-[2px]",
  md: "text-[14px] h-10 px-4 rounded-[2px]",
  lg: "text-[15px] h-11 px-5 rounded-[2px]",
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
