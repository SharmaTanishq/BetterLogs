"use client";

import { motion } from "motion/react";
import { PlateHeader } from "./plate";
import { WaitlistForm } from "./waitlist-form";

const EASE_SNAP = [0.2, 0, 0, 1] as const;

export function Hero() {
  return (
    <section id="hero" className="relative border-b border-[var(--color-foreground)]">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <PlateHeader
          n="001"
          label="BRAND_INTRO"
          meta="CASE-LEVEL · OTEL-NATIVE · v1.1"
          className="pt-10"
        />

        <div className="grid gap-10 pb-20 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-28 lg:pt-24">
          {/* Left: wordmark + statement + waitlist */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE_SNAP }}
              className="font-display leading-[0.85] tracking-[-0.04em] text-[var(--color-foreground)]"
              style={{ fontSize: "clamp(80px, 14vw, 200px)", fontWeight: 700 }}
            >
              <span>BetterLog</span>
              <span aria-hidden className="text-[var(--color-foreground)]">
                _
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.05, ease: EASE_SNAP }}
              className="mt-6 max-w-[560px] font-sans text-[18px] leading-[1.4] text-[var(--color-foreground)] sm:text-[20px]"
            >
              Case-level workflow diagnosis.
              <br />
              Root cause. Context. Action.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.1, ease: EASE_SNAP }}
              className="mt-6 max-w-[540px] text-[15.5px] leading-[1.55] text-[var(--color-foreground-subtle)]"
            >
              Engineers declare workflow steps; BetterLog stitches them into named business
              workflows on top of OpenTelemetry. When something fails, the result is one
              plain-language explanation — readable by the engineer who built it{" "}
              <em className="text-[var(--color-foreground)] not-italic">and</em> the ops person
              getting the Slack message at 2&nbsp;AM.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.15, ease: EASE_SNAP }}
              className="mt-10 max-w-[540px]"
            >
              <WaitlistForm id="waitlist" />
            </motion.div>
          </div>

          {/* Right: CLI artifact tile */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.18, ease: EASE_SNAP }}
            className="flex flex-col"
          >
            <div className="border border-[var(--color-foreground)] bg-[var(--color-surface)]">
              {/* tile header */}
              <div className="flex items-center justify-between border-b border-[var(--color-foreground)] px-4 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
                  006_CLI_ARTIFACT
                </span>
                <span className="font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
                  command_line_intelligence
                </span>
              </div>
              <CLISnippet />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatTile n="93%" label="MTTR_REDUCTION" />
              <StatTile n="0" label="LOCK_IN" sub="OTel-native" />
              <StatTile n="BYOK" label="LLM" sub="OpenAI · Anthropic · Ollama" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatTile({ n, label, sub }: { n: string; label: string; sub?: string }) {
  return (
    <div className="border border-[var(--color-foreground)] bg-[var(--color-surface)] p-4">
      <div className="font-display text-[28px] font-bold leading-none tracking-[-0.02em] text-[var(--color-foreground)]">
        {n}
      </div>
      <div className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-foreground-muted)]">
        {label}
      </div>
      {sub && (
        <div className="mt-1 font-mono text-[10.5px] text-[var(--color-foreground-subtle)]">
          {sub}
        </div>
      )}
    </div>
  );
}

function CLISnippet() {
  return (
    <pre className="overflow-x-auto bg-[var(--color-void)] p-5 font-mono text-[12.5px] leading-[1.65] text-[var(--color-concrete)]">
      <code>
        <span className="text-[var(--color-foreground-subtle)]">$ </span>
        <span className="text-[var(--color-concrete)]">betterlog diagnose order-1234</span>
        {"\n\n"}
        <span className="text-[var(--color-foreground-subtle)]">workflow   </span>
        <span>order-fulfillment</span>
        <span className="text-[var(--color-foreground-subtle)]">   status </span>
        <span style={{ color: "var(--color-alert)" }}>FAILED</span>
        {"\n"}
        <span className="text-[var(--color-foreground-subtle)]">failed step </span>
        <span>sku-mapping</span>
        {"  "}
        <span className="text-[var(--color-foreground-subtle)]">(0.843s)</span>
        {"\n"}
        <span className="text-[var(--color-foreground-subtle)]">root cause  </span>
        <span>unmapped_sku</span>
        {"\n\n"}
        <span className="text-[var(--color-foreground-subtle)]">similar failures (3)</span>
        {"\n"}
        <span className="text-[var(--color-foreground-subtle)]">#1 </span>
        <span>order-0754</span>
        {"   "}
        <span>unmapped_sku</span>
        {"     "}
        <span style={{ color: "var(--color-trace)" }}>0.92</span>
        {"\n"}
        <span className="text-[var(--color-foreground-subtle)]">#2 </span>
        <span>order-0321</span>
        {"   "}
        <span>unmapped_sku</span>
        {"     "}
        <span style={{ color: "var(--color-trace)" }}>0.88</span>
        {"\n"}
        <span className="text-[var(--color-foreground-subtle)]">#3 </span>
        <span>order-0789</span>
        {"   "}
        <span>unmapped_sku</span>
        {"     "}
        <span style={{ color: "var(--color-trace)" }}>0.66</span>
        {"\n\n"}
        <span className="text-[var(--color-foreground-subtle)]">suggested fix </span>
        <span style={{ color: "var(--color-trace)" }}>Add mapping for SKU: ABC-123</span>
        <span className="caret bg-[var(--color-concrete)]" />
      </code>
    </pre>
  );
}
