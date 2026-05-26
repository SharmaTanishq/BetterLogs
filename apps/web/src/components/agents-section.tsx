"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Boxes, Lock, ScanLine, ShieldCheck, TerminalSquare, Workflow } from "lucide-react";
import { PlateHeader } from "./plate";

const EASE_SNAP = [0.2, 0, 0, 1] as const;

const ENGINEER_BENEFITS = [
  {
    icon: TerminalSquare,
    title: "CLI-native RCA",
    body: "Run `betterlog diagnose <business_key>` from your terminal. Get failed step, root cause, similar past failures, and a suggested fix in seconds.",
  },
  {
    icon: Workflow,
    title: "OTel-native, additive",
    body: "Emits standard OTel spans through your existing collector. Jaeger, Tempo, Datadog — keep them. We add a semantic layer on top.",
  },
  {
    icon: Boxes,
    title: "Explicit workflow contract",
    body: "Step sequence is declared at instrumentation time with @workflow + recordStep(). No probabilistic inference from timestamps and parentage.",
  },
];

const OPS_BENEFITS = [
  {
    icon: ScanLine,
    title: "Plain-language failures",
    body: "Business keys (order_id, invoice_id) and named steps — not span IDs or latency percentiles. Ops can read it without learning distributed tracing.",
  },
  {
    icon: ShieldCheck,
    title: "Recurring pattern memory",
    body: "Similar past failures surfaced with every diagnosis via pgvector similarity. Stop re-investigating the same SKU mapping error.",
  },
  {
    icon: Lock,
    title: "BYOK, self-hostable",
    body: "Bring your own LLM key (OpenAI, Anthropic, Ollama). Self-host the stack in your own cloud. Zero data egress for regulated industries.",
  },
];

export function BuiltForBoth() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      id="built-for"
      className="relative border-b border-[var(--color-foreground)] bg-[var(--color-background)]"
    >
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <PlateHeader n="005" label="BUILT_FOR_BOTH" meta="ENGINEER + OPS" />

        <div className="mt-6 grid items-end gap-6 sm:grid-cols-[1.2fr_0.8fr]">
          <h2
            className="font-display font-bold leading-[1] tracking-[-0.025em] text-[var(--color-foreground)]"
            style={{ fontSize: "clamp(34px, 5vw, 64px)" }}
          >
            One diagnosis.
            <br />
            Two readers.
          </h2>
          <p className="text-[15px] leading-[1.55] text-[var(--color-foreground-subtle)]">
            The engineer who built the system needs trace fidelity. The ops person on call
            needs a plain answer. BetterLog ships both, off the same data.
          </p>
        </div>

        <div ref={ref} className="mt-14 grid gap-px bg-[var(--color-foreground)] lg:grid-cols-2">
          <PersonaBlock
            label="FOR_ENGINEERS"
            persona="The platform / infra engineer"
            tagline="CLI, OTel, no re-instrumentation."
            benefits={ENGINEER_BENEFITS}
            inView={inView}
            accent="signal"
          />
          <PersonaBlock
            label="FOR_OPS"
            persona="The on-call ops teammate"
            tagline="Read it, fix it, move on."
            benefits={OPS_BENEFITS}
            inView={inView}
            accent="trace"
          />
        </div>

        {/* Wedge segment band */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-[var(--color-foreground)] pt-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
            ENTRY_SEGMENT
          </span>
          {[
            "E-commerce fulfillment",
            "Logistics workflows",
            "B2B SaaS order pipelines",
            "Multi-service order, invoice, shipment graphs",
          ].map((t) => (
            <span
              key={t}
              className="border border-[var(--color-foreground)] bg-[var(--color-surface)] px-2 py-1 font-mono text-[11.5px] text-[var(--color-foreground)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
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
  benefits: Array<{ icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; body: string }>;
  inView: boolean;
  accent: "signal" | "trace";
}) {
  const dot = accent === "signal" ? "var(--color-signal)" : "var(--color-trace)";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.22, ease: EASE_SNAP }}
      className="border border-[var(--color-foreground)] bg-[var(--color-surface)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-foreground)] px-5 py-2.5 sm:px-6">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: dot }}
          />
          {label}
        </span>
        <span className="font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
          {tagline}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="font-display text-[22px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-foreground)]">
          {persona}
        </h3>

        <div className="mt-6 grid gap-px bg-[var(--color-foreground)]">
          {benefits.map((b) => (
            <article
              key={b.title}
              className="flex gap-3 border border-[var(--color-foreground)] bg-[var(--color-surface)] p-4 transition-shadow duration-[var(--motion-base)] hover:shadow-[0_0_0_1px_var(--color-foreground)]"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--color-foreground)] bg-[var(--color-background)] text-[var(--color-foreground)]"
              >
                <b.icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h4 className="text-[15px] font-semibold leading-[1.2] text-[var(--color-foreground)]">
                  {b.title}
                </h4>
                <p className="mt-1 text-[13.5px] leading-[1.55] text-[var(--color-foreground-muted)]">
                  {b.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
