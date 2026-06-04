"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PanelChrome, Section, SectionHeader } from "./section";
import { WaitlistForm } from "./waitlist-form";

const EASE = [0.2, 0, 0, 1] as const;

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <Section id="waitlist-bottom" variant="void" bordered={false}>
      <div ref={ref}>
        <SectionHeader
          onDark
          title={
            <>
              Stop reading logs.
              <br />
              Start reading workflows.
            </>
          }
          description="Onboarding the first cohort of design partners: teams with case-keyed workflows they own end-to-end. Free during private beta. BYOK LLM. Self-hostable."
        />

        <div className="mt-10 grid min-w-0 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <motion.div
            initial={{ opacity: 1, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 8 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="min-w-0 max-w-[var(--container-prose)]"
          >
            <WaitlistForm id="waitlist-bottom" surface="dark" />
          </motion.div>

          <motion.div
            initial={{ opacity: 1, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 10 }}
            transition={{ duration: 0.22, delay: 0.08, ease: EASE }}
            className="min-w-0"
          >
            <PanelChrome label="What you get" meta="v1" onDark>
              <ul className="divide-y divide-[var(--color-concrete)]/30">
                {[
                  ["SDK + CLI (OSS)", "Annotate · diagnose · ship"],
                  ["Hosted backend", "Stitching · pgvector · LLM agent"],
                  ["Web app (early)", "Visual workflow graph · ops-facing"],
                  ["BYOK LLM", "OpenAI · Anthropic · Ollama"],
                  ["Self-host option", "Commercial license available"],
                ].map(([k, v]) => (
                  <li key={k} className="flex flex-wrap items-baseline justify-between gap-4 px-4 py-3 sm:px-5">
                    <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--color-paper)]">
                      {k}
                    </span>
                    <span className="text-right font-mono text-[12px] text-[var(--color-concrete)]/70">
                      {v}
                    </span>
                  </li>
                ))}
              </ul>
            </PanelChrome>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
