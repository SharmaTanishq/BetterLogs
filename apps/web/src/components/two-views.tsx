"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Section, SectionHeader } from "./section";

const EASE = [0.2, 0, 0, 1] as const;

export function TwoViewsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <Section id="two-views">
      <SectionHeader
        title={
          <>
            One failure.
            <br />
            Two readers.
          </>
        }
        description="Datadog, Honeycomb, and Dynatrace infer workflow shape from span timestamps. That works for system debugging, not for case-level questions. BetterLog locks step sequence at instrumentation time."
      />

      <div
        ref={ref}
        className="mt-10 grid min-w-0 gap-px bg-[var(--color-border)] md:grid-cols-2"
      >
        <ComparePanel
          inView={inView}
          delay={0}
          label="Without BetterLog"
          meta="raw spans · trace IDs"
          viewLabel="Engineer view"
          tone="alert"
          timeLabel="30–90 min"
        >
          <SpansFigure />
          <BulletList
            tone="alert"
            items={[
              <>
                7 spans across 5 services. No business key. The span name is{" "}
                <code className="bg-[var(--color-surface-inset)] px-1 font-mono text-[12px]">
                  http.client POST
                </code>
                , not{" "}
                <code className="bg-[var(--color-surface-inset)] px-1 font-mono text-[12px]">
                  sku-mapping
                </code>
                .
              </>,
              "Ops gets paged. They paste the trace ID in Slack and wait for an engineer to translate.",
              "No memory. The same SKU mapping failure last week is a different trace ID; nobody connects them.",
            ]}
          />
        </ComparePanel>

        <ComparePanel
          inView={inView}
          delay={0.06}
          label="With BetterLog"
          meta="named workflow · business keys"
          viewLabel="Engineer and ops"
          tone="trace"
          timeLabel="Seconds"
        >
          <DiagnosisCard />
          <BulletList
            tone="trace"
            items={[
              <>
                Failure in business terms:{" "}
                <span className="text-[var(--color-ink)]">
                  order-1234, step sku-mapping, unmapped SKU ABC-123
                </span>
                .
              </>,
              "Recurrence flagged automatically. Same root cause hit 3 other orders this month (pgvector similarity).",
              <>
                Concrete fix proposed:{" "}
                <span className="text-[var(--color-ink)]">add mapping for SKU ABC-123</span>.
                Ops can act, or escalate with the right context.
              </>,
            ]}
          />
        </ComparePanel>
      </div>
    </Section>
  );
}

function ComparePanel({
  inView,
  delay,
  label,
  meta,
  viewLabel,
  tone,
  timeLabel,
  children,
}: {
  inView: boolean;
  delay: number;
  label: string;
  meta: string;
  viewLabel: string;
  tone: "alert" | "trace";
  timeLabel: string;
  children: React.ReactNode;
}) {
  const accent = tone === "alert" ? "var(--color-alert)" : "var(--color-trace)";

  return (
    <motion.div
      initial={{ opacity: 1, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 10 }}
      transition={{ duration: 0.22, delay, ease: EASE }}
      className="flex min-w-0 flex-col border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-5 py-2.5 sm:px-6">
        <span className="font-display text-[15px] uppercase tracking-[0.08em] text-[var(--color-ink)]">
          {label}
        </span>
        <span className="font-mono text-[10.5px] text-[var(--color-muted)]">{meta}</span>
      </div>
      <div className="p-5 sm:p-6 lg:p-7">
          <div className="font-sans text-[13px] font-medium text-[var(--color-ink-2)]">
            {viewLabel}
          </div>
          {children}
          <div className="mt-6 flex items-baseline justify-between border-t border-[var(--color-border)] pt-4">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Time to answer
            </span>
            <span
              className="font-display text-[var(--text-title)] leading-none"
              style={{ color: accent }}
            >
              {timeLabel}
            </span>
          </div>
        </div>
      </motion.div>
  );
}

function BulletList({ tone, items }: { tone: "alert" | "trace"; items: React.ReactNode[] }) {
  const accent = tone === "alert" ? "var(--color-alert)" : "var(--color-trace)";
  return (
    <ul className="mt-5 space-y-2.5 text-[13.5px] leading-[1.55] text-[var(--color-ink-2)]">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            aria-hidden
            className="mt-[7px] inline-block h-1 w-3 shrink-0"
            style={{ background: accent }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SpansFigure() {
  const SPANS: Array<{ offset: number; width: number; tone: "ok" | "alert" }> = [
    { offset: 0, width: 100, tone: "ok" },
    { offset: 4, width: 14, tone: "ok" },
    { offset: 19, width: 4, tone: "ok" },
    { offset: 24, width: 18, tone: "ok" },
    { offset: 44, width: 28, tone: "ok" },
    { offset: 74, width: 24, tone: "alert" },
  ];
  return (
    <div className="mt-4 border border-[var(--color-border)] bg-[var(--color-void)] p-3">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-concrete)]/60">
        <span>trace_id 4f9c…ab12</span>
        <span>1.42s</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {SPANS.map((s, i) => (
          <div key={i} className="relative h-3.5 w-full">
            <span
              className="absolute h-3.5"
              style={{
                left: `${s.offset}%`,
                width: `${s.width}%`,
                background: s.tone === "alert" ? "var(--color-alert)" : "var(--color-trace)",
                opacity: s.tone === "alert" ? 0.95 : 0.7,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 font-mono text-[10.5px] text-[var(--color-concrete)]/55">
        Which span failed? Which order? Whose problem?
      </div>
    </div>
  );
}

function DiagnosisCard() {
  return (
    <div className="mt-4 border border-[var(--color-border)] bg-[var(--color-surface-inset)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink)]">
        <span>order_id : 1234</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-alert)]" />
          Failed
        </span>
      </div>
      <div className="mt-3 font-display text-[18px] font-medium leading-[1.25] text-[var(--color-ink)]">
        Step <span className="font-mono text-[16px]">sku-mapping</span> rejected the order:
        no mapping for SKU <span className="font-mono text-[16px]">ABC-123</span>.
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-px bg-[var(--color-border)]">
        <div className="min-w-0 bg-[var(--color-surface)] p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Pattern
          </div>
          <div className="mt-1 font-display text-[20px] font-semibold leading-none text-[var(--color-ink)]">
            3×
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-[var(--color-muted)]">
            same root cause this month
          </div>
        </div>
        <div className="min-w-0 bg-[var(--color-surface)] p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Suggested fix
          </div>
          <div className="mt-1 font-mono text-[12.5px] leading-[1.45] text-[var(--color-ink)]">
            Add mapping for
            <br />
            SKU: ABC-123
          </div>
        </div>
      </div>
    </div>
  );
}
