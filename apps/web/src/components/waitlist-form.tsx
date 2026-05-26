"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type State = "idle" | "loading" | "success";

interface WaitlistFormProps {
  id?: string;
  /** "light" = paper canvas, "dark" = void canvas. */
  surface?: "light" | "dark";
  className?: string;
}

/**
 * Brutalist CLI-prompt waitlist form. UI-only — simulates submit latency, then
 * morphs to a success state. No network call (per the brief: keep the waitlist
 * surface but no business logic yet).
 *
 *   $ betterlog waitlist > [ you@yourcompany.com    ] [ Join Waitlist → ]
 *   Press ↵ to join · your data goes to no third parties yet
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
  const ink = isDark ? "text-[var(--color-paper)]" : "text-[var(--color-foreground)]";
  const subtle = isDark
    ? "text-[var(--color-concrete)]/70"
    : "text-[var(--color-foreground-subtle)]";
  const border = isDark ? "border-[var(--color-concrete)]" : "border-[var(--color-foreground)]";
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
          "group flex items-stretch border transition-shadow",
          border,
          fieldBg,
          "focus-within:shadow-[0_0_0_1px_var(--color-foreground)]",
          isDark && "focus-within:shadow-[0_0_0_1px_var(--color-concrete)]",
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
                "flex flex-1 items-center gap-2 px-3 font-mono text-[14px]",
                ink,
              )}
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: "var(--color-trace)" }}
              />
              <span>request_received &middot; we&rsquo;ll be in touch.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={state !== "idle"}
          className={cn(
            "flex shrink-0 items-center gap-2 border-l px-4 font-sans text-[13px] font-medium transition-colors duration-[var(--motion-base)]",
            border,
            "bg-[var(--color-signal)] text-white hover:bg-[#1d4ed8] active:translate-y-px",
            "disabled:cursor-not-allowed disabled:opacity-90",
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
                className="inline-flex items-center gap-2"
              >
                Join Waitlist
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" strokeWidth={2.4} />
                Joined
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
