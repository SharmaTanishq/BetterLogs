"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Section, SectionHeader } from "./section";

const EASE = [0.2, 0, 0, 1] as const;

const ENGINEER_BENEFITS = [
  {
    title: "CLI-native RCA",
    body: "Run `betterlog diagnose <business_key>` from your terminal. Failed step, root cause, similar past failures, and a suggested fix in seconds.",
  },
  {
    title: "OTel-native, additive",
    body: "Emits standard OTel spans through your existing collector. Jaeger, Tempo, Datadog stay in place. BetterLog adds a semantic layer on top.",
  },
  {
    title: "Explicit workflow contract",
    body: "Step sequence is declared at instrumentation time with @workflow + recordStep(). No probabilistic inference from timestamps and parentage.",
  },
];

const OPS_BENEFITS = [
  {
    title: "Plain-language failures",
    body: "Business keys (order_id, invoice_id) and named steps, not span IDs or latency percentiles. Ops can read it without learning distributed tracing.",
  },
  {
    title: "Recurring pattern memory",
    body: "Similar past failures surfaced with every diagnosis via pgvector similarity. Stop re-investigating the same SKU mapping error.",
  },
  {
    title: "BYOK, self-hostable",
    body: "Bring your own LLM key (OpenAI, Anthropic, Ollama). Self-host the stack in your own cloud. Zero data egress for regulated industries.",
  },
];

export function BuiltForBoth() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <Section id="built-for">
      <SectionHeader
        title={
          <>
            Built for whoever
            <br />
            is on call.
          </>
        }
        description="The platform engineer champions it to reduce Slack interrupts. The ops teammate uses it to get an answer without paging engineering. Same diagnosis, two jobs to be done."
      />

      <div ref={ref} className="mt-10 grid min-w-0 gap-px bg-[var(--color-border)] lg:grid-cols-2">
        <PersonaBlock
          label="For engineers"
          persona="Platform / infra engineer"
          tagline="CLI · OTel · low-effort instrumentation"
          benefits={ENGINEER_BENEFITS}
          inView={inView}
          accent="accent"
        />
        <PersonaBlock
          label="For ops"
          persona="On-call ops teammate"
          tagline="Read it · fix it · move on"
          benefits={OPS_BENEFITS}
          inView={inView}
          accent="trace"
        />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-6">
        <span className="font-sans text-[13px] font-medium text-[var(--color-ink-2)]">
          Entry segments
        </span>
        {[
          "E-commerce fulfillment",
          "Invoice / billing sync",
          "ETL & scheduled jobs",
          "Webhook handler chains",
        ].map((t) => (
          <span
            key={t}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-sans text-[12.5px] text-[var(--color-ink)]"
          >
            {t}
          </span>
        ))}
      </div>
    </Section>
  );
}

function PersonaBlock({
  label,
  persona,
  tagline,
  benefits,
  inView,
  accent,
}: {
  label: string;
  persona: string;
  tagline: string;
  benefits: Array<{ title: string; body: string }>;
  inView: boolean;
  accent: "accent" | "trace";
}) {
  const dot = accent === "accent" ? "var(--color-accent)" : "var(--color-trace)";

  return (
    <motion.div
      initial={{ opacity: 1, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 8 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-5 py-3 sm:px-6">
        <span className="inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-[var(--color-ink)]">
          <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} />
          {label}
        </span>
        <span className="font-sans text-[12.5px] text-[var(--color-muted)]">{tagline}</span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="font-display text-[22px] font-semibold leading-[1.1] text-[var(--color-ink)]">
          {persona}
        </h3>

        <ul className="mt-6 space-y-5">
          {benefits.map((b) => (
            <li key={b.title} className="min-w-0">
              <h4 className="text-[15px] font-semibold leading-[1.2] text-[var(--color-ink)]">
                {b.title}
              </h4>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-[var(--color-ink-2)]">{b.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
