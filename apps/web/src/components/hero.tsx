"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { WaitlistForm } from "./waitlist-form";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 + i * 0.08 },
  }),
};

export function Hero() {
  return (
    <section className="hero-wash relative overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-16 sm:px-8 sm:pb-32 sm:pt-24 lg:pt-32">
        <div className="mx-auto max-w-[820px] text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)]/70 px-3 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-ink-83)]" strokeWidth={1.8} />
            <span className="text-[13px] text-[var(--color-ink-83)]">
              Private beta &middot; Cohort 1 opens this fall
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-7 font-semibold text-[var(--color-ink)] sm:mt-9"
            style={{
              fontSize: "clamp(40px, 7.2vw, 68px)",
              lineHeight: 1.04,
              letterSpacing: "-0.032em",
            }}
          >
            What happened to{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10">order #2847?</span>
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 bottom-1 -z-0 block h-[10px] origin-left rounded-sm"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255, 196, 173, 0.85), rgba(241, 222, 191, 0.85))",
                }}
              />
            </span>
            <br className="hidden sm:block" />
            <span className="text-[var(--color-ink-83)]"> Answered in seconds.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.55] text-[var(--color-muted)] sm:mt-7 sm:text-[18px]"
          >
            BetterLog watches your business workflows end-to-end across every service. When
            something breaks, an AI agent reads the logs, traces the path, and explains the failure
            in plain English &mdash; so on-call doesn&rsquo;t mean a four-hour log dive at 2&nbsp;AM.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-9 max-w-[480px] sm:mt-10"
          >
            <WaitlistForm id="waitlist" variant="hero" />
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-7 flex items-center justify-center gap-3"
          >
            <AvatarStack />
            <span className="text-[13px] text-[var(--color-muted)]">
              247 engineers from Wilco, Rye, Cresta &amp; others
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-20 max-w-[980px] sm:mt-24"
        >
          <DiagnosisDemo />
        </motion.div>
      </div>
    </section>
  );
}

function AvatarStack() {
  const seeds = ["#d6c1a0", "#c8b8e0", "#a6c5d6", "#dcb6a8", "#bdcfa6"];
  return (
    <div className="flex -space-x-2">
      {seeds.map((c, i) => (
        <span
          key={i}
          className="inline-block h-7 w-7 rounded-full border-2 border-[var(--color-cream)]"
          style={{ background: c }}
          aria-hidden
        />
      ))}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   AI diagnosis demo — animated chat panel + workflow trace
   The "agent" message types out, then a trace timeline reveals beneath it.
   No backend; purely a UI illustration of the product behavior.
   -------------------------------------------------------------------------- */
function DiagnosisDemo() {
  const fullAnswer =
    "Order #2847 stopped at the Epicor ERP step. The Medusa → RabbitMQ publish succeeded (12:04:11), but the back40 OMS consumer timed out after 30s waiting on Epicor's POST /sales_orders. Epicor returned 503 three times. Retry the order or open a ticket with NetOps — Epicor latency has been elevated since 11:47.";

  const [chars, setChars] = useState(0);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    const startDelay = window.setTimeout(() => {
      const tick = window.setInterval(() => {
        setChars((c) => {
          if (c >= fullAnswer.length) {
            window.clearInterval(tick);
            window.setTimeout(() => setShowTrace(true), 250);
            return c;
          }
          return c + 2;
        });
      }, 14);
    }, 800);
    return () => window.clearTimeout(startDelay);
  }, []);

  return (
    <div className="overflow-hidden rounded-[16px] border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)] shadow-soft-card">
      {/* macOS-style chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--color-cream-border)] bg-[var(--color-cream)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e8b3a8]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e6d49b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#b6d4a7]" />
        <span className="ml-2 text-[12px] text-[var(--color-muted)]">betterlog &mdash; ask</span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        {/* Left: chat */}
        <div className="border-b border-[var(--color-cream-border)] p-5 md:border-b-0 md:border-r md:p-7">
          {/* User question */}
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-[12px] rounded-br-[4px] bg-[var(--color-ink)] px-4 py-3 text-[14.5px] leading-[1.5] text-[var(--color-cream-soft)] shadow-inset-dark">
              What happened to order #2847?
            </div>
          </div>

          {/* Agent answer */}
          <div className="mt-5 flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream-soft)]"
              aria-hidden
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1 rounded-[12px] rounded-tl-[4px] border border-[var(--color-cream-border)] bg-[var(--color-cream)] px-4 py-3 text-[14.5px] leading-[1.55] text-[var(--color-ink-82)]">
              {fullAnswer.slice(0, chars)}
              {chars < fullAnswer.length && <span className="caret bg-[var(--color-ink)]" />}
            </div>
          </div>
        </div>

        {/* Right: workflow trace */}
        <div className="p-5 md:p-7">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Workflow trace
            </span>
            <span className="rounded-full border border-[var(--color-cream-border)] bg-[var(--color-cream)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-ink-82)]">
              order_id=2847
            </span>
          </div>

          <TraceTimeline visible={showTrace} />
        </div>
      </div>
    </div>
  );
}

function TraceTimeline({ visible }: { visible: boolean }) {
  const steps: Array<{
    label: string;
    service: string;
    ms: string;
    state: "ok" | "ok-fast" | "fail";
  }> = [
    { label: "Checkout submitted", service: "Nuxt storefront", ms: "82ms", state: "ok-fast" },
    { label: "Order persisted", service: "Medusa", ms: "143ms", state: "ok" },
    { label: "Event published", service: "RabbitMQ", ms: "11ms", state: "ok-fast" },
    { label: "Inventory check", service: "OmniAPI · inventory", ms: "212ms", state: "ok" },
    { label: "ERP sync", service: "back40 → Epicor", ms: "30000ms", state: "fail" },
  ];

  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <motion.li
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.32, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-start gap-3 pb-4 last:pb-0"
        >
          {/* connector */}
          {i < steps.length - 1 && (
            <span
              className={`absolute left-[10px] top-[22px] h-[calc(100%-12px)] w-px ${
                s.state === "fail" ? "" : "bg-[var(--color-cream-border)]"
              }`}
              style={s.state === "fail" ? { background: "rgba(164,69,58,0.3)" } : undefined}
              aria-hidden
            />
          )}
          <span
            className={[
              "relative z-10 mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              s.state === "fail"
                ? "border-[var(--color-danger)] bg-[var(--color-cream-soft)]"
                : "border-[var(--color-ink)] bg-[var(--color-cream-soft)]",
            ].join(" ")}
            aria-hidden
          >
            {s.state === "fail" ? (
              <span className="block h-1.5 w-1.5 rounded-full bg-[var(--color-danger)]" />
            ) : (
              <span className="block h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`truncate text-[14px] ${
                  s.state === "fail"
                    ? "font-medium text-[var(--color-danger)]"
                    : "text-[var(--color-ink)]"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`shrink-0 font-mono text-[11.5px] ${
                  s.state === "fail" ? "text-[var(--color-danger)]" : "text-[var(--color-muted)]"
                }`}
              >
                {s.ms}
              </span>
            </div>
            <div className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">{s.service}</div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
