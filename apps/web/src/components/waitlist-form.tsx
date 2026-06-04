"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type State = "idle" | "loading" | "success";

interface WaitlistFormProps {
  id?: string;
  /** "light" = paper canvas, "dark" = void canvas. */
  surface?: "light" | "dark";
  className?: string;
}

/**
 * CLI-prompt waitlist form — mono field row with a terminal-native submit affordance.
 * UI-only: simulates submit latency, then morphs to success. No network call yet.
 *
 *   $ betterlog waitlist
 *   > you@yourcompany.com · join →
 */
export function WaitlistForm({ id = "waitlist", surface = "light", className }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state !== "idle") return;
    setState("loading");
    window.setTimeout(() => setState("success"), 900);
  };

  const isDark = surface === "dark";
  const ink = isDark ? "text-[var(--color-paper)]" : "text-[var(--color-ink)]";
  const subtle = isDark ? "text-[var(--color-concrete)]/70" : "text-[var(--color-muted)]";
  const border = isDark ? "border-[var(--color-concrete)]/40" : "border-[var(--color-border)]";
  const fieldBg = isDark ? "bg-[var(--color-void)]" : "bg-[var(--color-surface)]";

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      aria-label="Join the BetterLog waitlist"
    >
      {/* CLI prompt eyebrow */}
      <div
        className={cn(
          "mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]",
          subtle,
        )}
      >
        <span>$</span>
        <span>betterlog waitlist</span>
      </div>

      {/* Field row */}
      <div
        className={cn(
          "group flex items-stretch overflow-hidden rounded-[var(--radius-card)] border transition-shadow",
          border,
          fieldBg,
          "focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-paper)]",
          isDark && "focus-within:ring-offset-[var(--color-void)]",
        )}
      >
        {/* Mono prefix */}
        <span
          className={cn(
            "flex select-none items-center border-r px-3 font-mono text-[14px]",
            border,
            ink,
          )}
          aria-hidden
        >
          &gt;
        </span>

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
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "min-w-0 flex-1 bg-transparent px-3 font-mono text-[14px] outline-none",
                ink,
                isDark
                  ? "placeholder:text-[var(--color-concrete)]/40"
                  : "placeholder:text-[var(--color-foreground-subtle)]",
              )}
            />
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16 }}
              className={cn(
                "flex flex-1 flex-col justify-center gap-2 px-3 py-2 font-mono text-[14px]",
                ink,
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: "var(--color-trace)" }}
                />
                <span>request_received · we&rsquo;ll be in touch.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail("");
                  setState("idle");
                }}
                className={cn(
                  "self-start text-[12px] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]",
                  subtle,
                )}
              >
                Submit another email
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={state !== "idle"}
          data-state={state}
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-l px-3.5 py-3 font-mono text-[12px] uppercase tracking-[0.1em]",
            border,
            "bg-transparent text-[var(--color-accent)]",
            "transition-[background-color,color,opacity,transform] duration-[var(--dur-short)] [transition-timing-function:var(--ease-out)]",
            "hover:bg-[var(--color-paper-3)] hover:text-[var(--color-focus)]",
            "focus-visible:outline-none focus-visible:bg-[var(--color-paper-3)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)]",
            "active:translate-y-px active:bg-[var(--color-surface-inset)]",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[var(--color-accent)]",
            "data-[state=loading]:text-[var(--color-muted)]",
            "data-[state=success]:text-[var(--color-trace)]",
            isDark &&
              "hover:bg-[var(--color-paper)]/10 hover:text-[var(--color-accent)] focus-visible:bg-[var(--color-paper)]/10 active:bg-[var(--color-paper)]/15",
          )}
          aria-label={
            state === "success" ? "Submitted" : state === "loading" ? "Submitting" : "Join waitlist"
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            {state === "idle" && (
              <motion.span
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                join
                <span aria-hidden className="text-[13px] leading-none">
                  →
                </span>
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.2} />
              </motion.span>
            )}
            {state === "success" && (
              <motion.span
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                ok
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Helper line — CLI style */}
      <div
        className={cn(
          "mt-2 flex items-center gap-3 font-mono text-[11px]",
          subtle,
        )}
      >
        <span>
          Press <kbd className={cn("border px-1 py-px text-[10px]", border)}>↵</kbd> to join
        </span>
        <span aria-hidden>·</span>
        <span>private beta · BYOK · no third-party tracking</span>
      </div>
    </form>
  );
}
