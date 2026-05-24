"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type State = "idle" | "loading" | "success";

interface WaitlistFormProps {
  id?: string;
  variant?: "hero" | "compact";
  className?: string;
}

export function WaitlistForm({ id = "waitlist", variant = "hero", className }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  // UI-only: simulate latency, then morph to success. No network call.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state !== "idle") return;
    setState("loading");
    window.setTimeout(() => setState("success"), 900);
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      aria-label="Join the BetterLog waitlist"
    >
      <div
        className={cn(
          "group relative flex items-center overflow-hidden rounded-[10px] border bg-[var(--color-cream-soft)]",
          "border-[var(--color-cream-border)] transition-all",
          "focus-within:border-[var(--color-ink-40)] focus-within:shadow-focus-warm",
          variant === "hero" ? "h-14 pl-5 pr-1.5" : "h-12 pl-4 pr-1",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state !== "success" ? (
            <motion.input
              key="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === "loading"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "flex-1 bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none",
                variant === "hero" ? "text-[16px]" : "text-[15px]",
              )}
            />
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-1 items-center gap-2.5 text-[var(--color-ink)]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream-soft)]">
                <motion.span
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                </motion.span>
              </span>
              <span className={variant === "hero" ? "text-[16px]" : "text-[15px]"}>
                You&rsquo;re on the list. We&rsquo;ll be in touch.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={state !== "idle"}
          whileTap={state === "idle" ? { scale: 0.97 } : undefined}
          className={cn(
            "shadow-inset-dark inline-flex items-center justify-center gap-1.5 rounded-[7px] bg-[var(--color-ink)] text-[var(--color-cream-soft)] transition-opacity",
            "hover:opacity-90 disabled:cursor-not-allowed",
            variant === "hero" ? "h-11 px-5 text-[15px]" : "h-9 px-4 text-[14px]",
          )}
          aria-label={
            state === "success" ? "Submitted" : state === "loading" ? "Submitting" : "Request access"
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {state === "idle" && (
              <motion.span
                key="cta"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-1.5"
              >
                Request access
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </motion.span>
            )}
            {state === "loading" && (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center"
              >
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.2} />
              </motion.span>
            )}
            {state === "success" && (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center"
              >
                <Check className="h-4 w-4" strokeWidth={2.4} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <p className="mt-3 text-[13px] text-[var(--color-muted)]">
        Free during private beta. No credit card. Unsubscribe anytime.
      </p>
    </form>
  );
}
