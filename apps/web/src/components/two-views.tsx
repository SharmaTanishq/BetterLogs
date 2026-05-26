"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { PlateHeader } from "./plate";

const EASE_SNAP = [0.2, 0, 0, 1] as const;

/**
 * Plate 003 — "Same failure. Different framing."
 * Side-by-side: raw OTel telemetry (the way Datadog/Honeycomb surface it)
 * vs. BetterLog's named-workflow framing. Sells the core positioning angle.
 */
export function TwoViewsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <section
      id="two-views"
      className="relative border-b border-[var(--color-foreground)] bg-[var(--color-background)]"
    >
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-28">
        <PlateHeader n="003" label="TWO_VIEWS" meta="SAME_FAILURE · DIFFERENT_FRAMING" />

        <div className="mt-6 grid items-end gap-6 sm:grid-cols-[1.2fr_0.8fr]">
          <h2
            className="font-display font-bold leading-[1] tracking-[-0.025em] text-[var(--color-foreground)]"
            style={{ fontSize: "clamp(34px, 5vw, 64px)" }}
          >
            One failure.
            <br />
            Two readers.
          </h2>
          <p className="text-[15px] leading-[1.55] text-[var(--color-foreground-subtle)]">
            Datadog, Honeycomb and Dynatrace show your engineer raw telemetry. BetterLog shows
            the ops person on call the same incident in language they can actually act on.
          </p>
        </div>

        <div
          ref={ref}
          className="mt-12 grid gap-px bg-[var(--color-foreground)] md:grid-cols-2"
        >
          {/* Left: raw spans view */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.22, ease: EASE_SNAP }}
            className="flex flex-col border border-[var(--color-foreground)] bg-[var(--color-surface)]"
          >
            <PanelHeader
              label="WITHOUT_BETTERLOG"
              meta="raw spans / latency percentiles"
            />
            <div className="p-5 sm:p-7">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
                ENGINEER_VIEW
              </div>
              <SpansFigure />
              <ul className="mt-5 space-y-2.5 text-[13.5px] leading-[1.55] text-[var(--color-foreground-muted)]">
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1 w-3 shrink-0"
                    style={{ background: "var(--color-alert)" }}
                  />
                  <span>
                    7 spans across 5 services. No business key. The span name is{" "}
                    <code className="bg-[var(--color-concrete)] px-1 font-mono text-[12px]">
                      http.client POST
                    </code>
                    , not{" "}
                    <code className="bg-[var(--color-concrete)] px-1 font-mono text-[12px]">
                      sku-mapping
                    </code>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1 w-3 shrink-0"
                    style={{ background: "var(--color-alert)" }}
                  />
                  <span>
                    Ops gets paged. They paste the trace ID in Slack and wait for an engineer
                    to translate.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1 w-3 shrink-0"
                    style={{ background: "var(--color-alert)" }}
                  />
                  <span>
                    No memory. The same SKU mapping failure last week is a different trace ID;
                    nobody connects them.
                  </span>
                </li>
              </ul>

              <FooterStat label="TIME_TO_ANSWER" value="30–90 min" tone="alert" />
            </div>
          </motion.div>

          {/* Right: BetterLog framing */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.22, delay: 0.06, ease: EASE_SNAP }}
            className="flex flex-col border border-[var(--color-foreground)] bg-[var(--color-surface)]"
          >
            <PanelHeader label="WITH_BETTERLOG" meta="named workflow / one explanation" />
            <div className="p-5 sm:p-7">
              <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
                BOTH_VIEW
              </div>
              <DiagnosisCard />
              <ul className="mt-5 space-y-2.5 text-[13.5px] leading-[1.55] text-[var(--color-foreground-muted)]">
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1 w-3 shrink-0"
                    style={{ background: "var(--color-trace)" }}
                  />
                  <span>
                    Failure described in business terms:{" "}
                    <span className="text-[var(--color-foreground)]">
                      order-1234, step sku-mapping, unmapped SKU ABC-123
                    </span>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1 w-3 shrink-0"
                    style={{ background: "var(--color-trace)" }}
                  />
                  <span>
                    Recurrence flagged automatically — same root cause hit 3 other orders this
                    month (pgvector similarity).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-1 w-3 shrink-0"
                    style={{ background: "var(--color-trace)" }}
                  />
                  <span>
                    Concrete fix proposed —{" "}
                    <span className="text-[var(--color-foreground)]">
                      add mapping for SKU ABC-123
                    </span>
                    . Ops can act, or escalate with the right context.
                  </span>
                </li>
              </ul>

              <FooterStat label="TIME_TO_ANSWER" value="seconds" tone="trace" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PanelHeader({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-foreground)] px-5 py-2.5 sm:px-7">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
        {label}
      </span>
      <span className="font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
        {meta}
      </span>
    </div>
  );
}

function FooterStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "alert" | "trace";
}) {
  const color = tone === "alert" ? "var(--color-alert)" : "var(--color-trace)";
  return (
    <div className="mt-6 flex items-baseline justify-between border-t border-[var(--color-foreground)] pt-4">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
        {label}
      </span>
      <span
        className="font-display text-[28px] font-bold leading-none tracking-[-0.02em]"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Visual artifacts inside each panel
   ------------------------------------------------------------------------ */

function SpansFigure() {
  // Static representation of OTel spans on a flame-graph-ish bar timeline.
  const SPANS: Array<{ name: string; offset: number; width: number; tone: "ok" | "alert" }> = [
    { name: "http.server POST /checkout", offset: 0, width: 100, tone: "ok" },
    { name: "db.insert orders", offset: 4, width: 14, tone: "ok" },
    { name: "amqp.publish order.created", offset: 19, width: 4, tone: "ok" },
    { name: "http.client POST /reserve", offset: 24, width: 18, tone: "ok" },
    { name: "http.client POST /charge", offset: 44, width: 28, tone: "ok" },
    { name: "http.client POST /pick_lists", offset: 74, width: 24, tone: "alert" },
  ];
  return (
    <div className="mt-4 border border-[var(--color-foreground)] bg-[var(--color-void)] p-3">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-concrete)]/60">
        <span>trace_id 4f9c…ab12</span>
        <span>1.42s</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {SPANS.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <div className="relative h-3.5 w-full">
              <span
                className="absolute h-3.5"
                style={{
                  left: `${s.offset}%`,
                  width: `${s.width}%`,
                  background:
                    s.tone === "alert" ? "var(--color-alert)" : "var(--color-trace)",
                  opacity: s.tone === "alert" ? 0.95 : 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 font-mono text-[10.5px] text-[var(--color-concrete)]/55">
        ⤷ which one failed? which order? whose problem?
      </div>
    </div>
  );
}

function DiagnosisCard() {
  return (
    <div className="mt-4 border border-[var(--color-foreground)] bg-[var(--color-surface-inset)] p-4">
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
        <span>order_id : 1234</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--color-alert)" }}
          />
          FAILED
        </span>
      </div>
      <div className="mt-3 font-display text-[18px] font-medium leading-[1.25] text-[var(--color-foreground)]">
        Step <span className="font-mono text-[16px]">sku-mapping</span> rejected the order —
        no mapping for SKU <span className="font-mono text-[16px]">ABC-123</span>.
      </div>
      <div className="mt-4 grid grid-cols-2 gap-px bg-[var(--color-foreground)]">
        <div className="bg-[var(--color-surface)] p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
            PATTERN
          </div>
          <div className="mt-1 font-display text-[20px] font-bold leading-none text-[var(--color-foreground)]">
            3×
          </div>
          <div className="mt-1 font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
            same root cause this month
          </div>
        </div>
        <div className="bg-[var(--color-surface)] p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-foreground-subtle)]">
            SUGGESTED_FIX
          </div>
          <div className="mt-1 font-mono text-[12.5px] leading-[1.45] text-[var(--color-foreground)]">
            Add mapping for
            <br />
            SKU: ABC-123
          </div>
        </div>
      </div>
    </div>
  );
}
