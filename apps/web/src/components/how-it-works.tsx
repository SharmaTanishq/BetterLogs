"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Section, SectionHeader } from "./section";

const EASE = [0.2, 0, 0, 1] as const;

const STEPS = [
  {
    n: "01",
    title: "Instrument",
    body: "Annotate handlers with the SDK. One decorator declares the workflow; one call per step records its outcome. Spans flow through your existing OTel collector unchanged.",
    code: `import { withWorkflow, recordStep } from "@betterlog/sdk-node";

await withWorkflow(
  { name: "order-fulfillment", id: order_id },
  async () => {
    await recordStep("persist-order",     orders.persist(order));
    await recordStep("reserve-inventory", inv.reserve(order));
    await recordStep("authorise-payment", pay.charge(order));
    await recordStep("sku-mapping",       oms.map(order));
  },
);`,
  },
  {
    n: "02",
    title: "Map",
    body: "BetterLog stitches @workflow-tagged spans into a structured object: ordered steps, business keys, success/failure per step. The graph is generated from your code; no diagrams to maintain.",
    code: `→ workflow  order-fulfillment   id  order_id:1234
  ✓ persist-order               143ms
  ✓ reserve-inventory           212ms
  ⚠ authorise-payment           640ms   p99 degraded
  ✗ sku-mapping                 843ms   422 unmapped_sku
  └ root_cause   sku=ABC-123 has no mapping`,
  },
  {
    n: "03",
    title: "Diagnose",
    body: "Run `betterlog diagnose order-1234` from the CLI, or click the failing node in the web app. A BYOK LLM agent reads the trace, surfaces similar past failures via pgvector, and proposes a concrete next action.",
    code: `> betterlog diagnose order-1234

failure       step  sku-mapping
root cause    unmapped_sku  SKU=ABC-123
similar       3 failures this month (sim 0.66-0.92)
suggested fix Add mapping for SKU: ABC-123 in OMS

Apply now? [y/N]`,
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <Section id="how-it-works">
      <SectionHeader
        title={
          <>
            Three steps
            <br />
            from blind to answered.
          </>
        }
        description="BetterLog is a semantic layer on top of OpenTelemetry. Keep your collector, dashboards, and alerts. We add an explicit workflow contract and a reader who can interpret it for whoever is on call."
      />

      <div
        ref={ref}
        className="mt-10 grid min-w-0 gap-px bg-[var(--color-ink)] lg:grid-cols-3"
      >
        {STEPS.map((step, i) => (
          <motion.article
            key={step.n}
            initial={{ opacity: 1, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 12 }}
            transition={{ duration: 0.22, delay: 0.05 + i * 0.06, ease: EASE }}
            className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="border-b border-[var(--color-border)] px-5 py-2.5 sm:px-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {step.n} · {step.title}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
              <h3 className="font-title text-[var(--color-ink)]">
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.55] text-[var(--color-ink-2)]">{step.body}</p>
              <pre className="mt-auto overflow-x-auto border border-[var(--color-border)] bg-[var(--color-void)] p-4 font-mono text-[11.5px] leading-[1.6] text-[var(--color-concrete)]">
                <code>{step.code}</code>
              </pre>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
