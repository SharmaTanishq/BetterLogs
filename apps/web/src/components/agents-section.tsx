"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Bot, GitBranch, ShieldCheck, Workflow } from "lucide-react";

const BENEFITS = [
  {
    icon: Bot,
    title: "Agent workflows are first-class",
    body: "Every tool call, retry, and handoff is captured as a step. When an agent loops or stalls, you see exactly where.",
  },
  {
    icon: GitBranch,
    title: "Built for non-deterministic flows",
    body: "Agents take different paths each run. BetterLog correlates by intent, not by hard-coded structure.",
  },
  {
    icon: Workflow,
    title: "Cross-system by default",
    body: "An agent that calls Slack → Linear → your DB → an LLM is one workflow. Not four dashboards.",
  },
  {
    icon: ShieldCheck,
    title: "Diagnose without leaking",
    body: "PII and secrets stay redacted. The agent reads structure, attributes, and outcomes — not raw payloads.",
  },
];

export function AgentsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section id="workflows" className="relative">
      <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[760px] text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]"
          >
            Made for AI-driven workflows
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 font-semibold text-[var(--color-ink)]"
            style={{
              fontSize: "clamp(30px, 4.4vw, 46px)",
              lineHeight: 1.06,
              letterSpacing: "-0.024em",
            }}
          >
            Your agents make decisions. We make them legible.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 text-[17px] leading-[1.55] text-[var(--color-muted)]"
          >
            AI agents take new paths each time they run &mdash; that&rsquo;s the point. But it
            makes them brutal to debug. BetterLog turns every agent run into a workflow you can
            inspect, query, and explain.
          </motion.p>
        </div>

        <div ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16">
          {BENEFITS.map((b, i) => (
            <motion.article
              key={b.title}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.45,
                delay: 0.08 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
              className="rounded-[16px] border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)] p-6 transition-shadow hover:shadow-soft-card sm:p-7"
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-ink)] text-[var(--color-cream-soft)]"
                aria-hidden
              >
                <b.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </span>
              <h3
                className="mt-4 text-[19px] font-semibold leading-[1.2] text-[var(--color-ink)]"
                style={{ letterSpacing: "-0.014em" }}
              >
                {b.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.55] text-[var(--color-muted)]">
                {b.body}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Use cases ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:mt-14"
        >
          <span className="text-[13px] text-[var(--color-muted)]">Built for:</span>
          {[
            "Order fulfillment",
            "Invoice processing",
            "Agentic RAG pipelines",
            "Multi-tool LLM agents",
            "Background job graphs",
            "Webhook fan-outs",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)] px-3 py-1 text-[12.5px] text-[var(--color-ink-83)]"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
