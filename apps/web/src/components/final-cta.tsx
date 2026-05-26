"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PlateHeader } from "./plate";
import { WaitlistForm } from "./waitlist-form";

const EASE_SNAP = [0.2, 0, 0, 1] as const;

/**
 * Plate 006 — final waitlist plate. Void canvas, inverted ink. Hosts the
 * second instance of the CLI-style waitlist form. Same component, same UI-only
 * submit→success transition; preserved per the brief.
 */
export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <section
      id="waitlist-bottom"
      className="relative border-b border-[var(--color-foreground)] bg-[var(--color-void)]"
    >
      <div ref={ref} className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <PlateHeader
          n="006"
          label="WAITLIST"
          meta="PRIVATE_BETA · DESIGN_PARTNERS"
          onDark
        />

        <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.22, ease: EASE_SNAP }}
              className="font-display font-bold leading-[1] tracking-[-0.025em] text-[var(--color-paper)]"
              style={{ fontSize: "clamp(40px, 6.5vw, 88px)" }}
            >
              Stop reading logs.
              <br />
              Start reading workflows.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.22, delay: 0.05, ease: EASE_SNAP }}
              className="mt-6 max-w-[520px] text-[15.5px] leading-[1.55] text-[var(--color-concrete)]/75"
            >
              We&rsquo;re onboarding the first cohort of design partners — e-commerce, logistics,
              and B2B SaaS teams with cross-service order, invoice, or shipment workflows. Free
              during private beta. BYOK LLM. Self-hostable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.22, delay: 0.1, ease: EASE_SNAP }}
              className="mt-10 max-w-[560px]"
            >
              <WaitlistForm id="waitlist-bottom" surface="dark" />
            </motion.div>
          </div>

          {/* Right: spec sheet tile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.22, delay: 0.12, ease: EASE_SNAP }}
            className="border border-[var(--color-concrete)] bg-[var(--color-void)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-concrete)] px-4 py-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-paper)]">
                WHAT_YOU_GET
              </span>
              <span className="font-mono text-[10.5px] text-[var(--color-concrete)]/60">
                v1.1
              </span>
            </div>
            <ul className="divide-y divide-[var(--color-concrete)]/30">
              {[
                ["SDK + CLI (OSS)", "Annotate · diagnose · ship"],
                ["Hosted backend", "Stitching · pgvector · LLM agent"],
                ["Web app (early)", "Visual workflow graph · ops-facing"],
                ["BYOK LLM", "OpenAI · Anthropic · Ollama"],
                ["Self-host option", "Commercial license available"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--color-paper)]">
                    {k}
                  </span>
                  <span className="text-right font-mono text-[12px] text-[var(--color-concrete)]/70">
                    {v}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
