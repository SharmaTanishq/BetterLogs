"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Code2, Eye, MessageSquare } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Code2,
    title: "Drop in the SDK",
    body: "One wrapper — `withWorkflow()` — around your existing handlers. Works with Node, OTel, and any service that can emit a trace.",
    code: `import { withWorkflow } from "@betterlog/sdk-node";

await withWorkflow(
  { name: "order.fulfill", id: order.id },
  async () => {
    await medusa.persist(order);
    await rabbit.publish("order.created", order);
    await epicor.sync(order); // ← this one fails
  }
);`,
  },
  {
    n: "02",
    icon: Eye,
    title: "We watch workflows end-to-end",
    body: "BetterLog joins logs, traces, and queue events into one timeline keyed by your business ID — order, invoice, job, anything.",
    code: `→ order.fulfill   id=2847
  ✓ medusa.persist          143ms
  ✓ rabbit.publish          11ms
  ✓ omni.inventory          212ms
  ✗ epicor.sync           30000ms  503
  └ retries: 3 · final: TIMEOUT`,
  },
  {
    n: "03",
    icon: MessageSquare,
    title: "Ask the AI agent",
    body: "When something breaks, the agent reads the trace + recent log context, then explains the failure in plain English with a suggested next step.",
    code: `> what happened to order #2847?

Epicor ERP returned 503 three times in a row.
back40 → epicor.sync timed out after 30s.
Epicor latency has been elevated since 11:47.
Suggested: retry · or notify NetOps.`,
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section id="how-it-works" className="relative border-y border-[var(--color-cream-border)]">
      <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[720px] text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]"
          >
            How it works
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
            Three steps from blind to answered.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 text-[17px] leading-[1.55] text-[var(--color-muted)]"
          >
            BetterLog sits between your observability stack and the people asking
            <em className="text-[var(--color-ink-82)] not-italic"> what happened</em>. It
            understands workflows as first-class objects.
          </motion.p>
        </div>

        <div ref={ref} className="mt-16 grid gap-5 lg:mt-20 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.n}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.55,
                delay: 0.1 + i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex flex-col rounded-[16px] border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)] p-6 transition-shadow sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[12px] text-[var(--color-muted)]">{step.n}</span>
                <span className="h-px flex-1 bg-[var(--color-cream-border)]" />
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-ink)]"
                  aria-hidden
                >
                  <step.icon className="h-[16px] w-[16px]" strokeWidth={1.6} />
                </span>
              </div>
              <h3
                className="mt-5 text-[22px] font-semibold leading-[1.15] text-[var(--color-ink)]"
                style={{ letterSpacing: "-0.018em" }}
              >
                {step.title}
              </h3>
              <p className="mt-2.5 text-[14.5px] leading-[1.55] text-[var(--color-muted)]">
                {step.body}
              </p>

              <pre className="mt-5 overflow-hidden rounded-[10px] border border-[var(--color-cream-border)] bg-[var(--color-cream)] p-3.5 font-mono text-[12px] leading-[1.55] text-[var(--color-ink-82)]">
                <code>{step.code}</code>
              </pre>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
