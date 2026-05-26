"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PlateHeader } from "./plate";

const EASE_SNAP = [0.2, 0, 0, 1] as const;

const STEPS = [
  {
    n: "01",
    title: "Instrument",
    body: "Annotate your handlers with the SDK. One decorator declares the workflow, one call per step records its outcome. Spans go through your existing OTel collector unchanged.",
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
    body: "BetterLog stitches your @workflow-tagged spans into a structured object — ordered steps, business keys, success/failure per step. The graph is generated from your code; no diagrams to maintain.",
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
    body: "Run `betterlog diagnose order-1234` from the CLI — or click the failing node in the web app. A BYOK LLM agent reads the trace, surfaces similar past failures via pgvector, and proposes a concrete next action.",
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
    <section
      id="how-it-works"
      className="relative border-b border-[var(--color-foreground)] bg-[var(--color-background)]"
    >
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <PlateHeader n="004" label="HOW_IT_WORKS" meta="SDK → MAP → DIAGNOSE" />

        <div className="mt-6 grid items-end gap-6 sm:grid-cols-[1.2fr_0.8fr]">
          <h2
            className="font-display font-bold leading-[1] tracking-[-0.025em] text-[var(--color-foreground)]"
            style={{ fontSize: "clamp(34px, 5vw, 64px)" }}
          >
            Three steps
            <br />
            from blind to answered.
          </h2>
          <p className="text-[15px] leading-[1.55] text-[var(--color-foreground-subtle)]">
            BetterLog is a semantic layer on top of OpenTelemetry. You keep your collector,
            your dashboards, your alerts. We add a contract — and a reader who can interpret
            it for whoever&rsquo;s on call.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-12 grid gap-px bg-[var(--color-foreground)] lg:grid-cols-3"
        >
          {STEPS.map((step, i) => (
            <motion.article
              key={step.n}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.22, delay: 0.05 + i * 0.06, ease: EASE_SNAP }}
              className="flex flex-col border border-[var(--color-foreground)] bg-[var(--color-surface)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-foreground)] px-5 py-2.5 sm:px-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
                  {step.n} · {step.title.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
                <h3
                  className="font-display text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-[var(--color-foreground)]"
                >
                  {step.title}.
                </h3>
                <p className="text-[14px] leading-[1.55] text-[var(--color-foreground-muted)]">
                  {step.body}
                </p>
                <pre className="mt-auto overflow-x-auto border border-[var(--color-foreground)] bg-[var(--color-void)] p-4 font-mono text-[11.5px] leading-[1.6] text-[var(--color-concrete)]">
                  <code>{step.code}</code>
                </pre>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
