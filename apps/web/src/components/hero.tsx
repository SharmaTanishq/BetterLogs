"use client";

import { motion } from "motion/react";
import { PanelChrome } from "./section";
import { WaitlistForm } from "./waitlist-form";

const EASE = [0.2, 0, 0, 1] as const;

export function Hero() {
  return (
    <section
      id="hero"
      className="border-b border-[var(--color-border)] bg-[var(--color-paper)]"
    >
      <div
        className="mx-auto w-full max-w-[var(--container-content)] px-5 sm:px-8"
        style={{ paddingBlock: "var(--space-section)" }}
      >
        <div className="grid min-w-0 items-start gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="flex min-w-0 flex-col">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]"
            >
              OTel-native · explicit workflow contract
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04, ease: EASE }}
              className="mt-6 font-display leading-[0.95] text-[var(--color-ink)]"
              style={{ fontSize: "var(--text-hero)", overflowWrap: "anywhere", minWidth: 0 }}
            >
              BetterLog<span aria-hidden>_</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.08, ease: EASE }}
              className="mt-6 max-w-[var(--container-prose)] text-[18px] leading-[1.4] text-[var(--color-ink)] sm:text-[20px]"
            >
              What happened to order-1234?
              <br />
              Root cause. Context. Action.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.12, ease: EASE }}
              className="mt-5 max-w-[var(--container-prose)] text-[15.5px] leading-[1.55] text-[var(--color-muted)]"
            >
              Engineers declare workflow steps with{" "}
              <code className="bg-[var(--color-surface-inset)] px-1 py-px font-mono text-[12.5px] text-[var(--color-ink)]">
                @workflow
              </code>{" "}
              and{" "}
              <code className="bg-[var(--color-surface-inset)] px-1 py-px font-mono text-[12.5px] text-[var(--color-ink)]">
                recordStep()
              </code>
              . BetterLog stitches spans into named, ordered workflows keyed to business
              identifiers, so ops get a plain-language answer without reading traces.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.16, ease: EASE }}
              className="mt-10 max-w-[var(--container-prose)]"
            >
              <WaitlistForm id="waitlist" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.18, ease: EASE }}
            className="min-w-0"
          >
            <PanelChrome label="CLI" meta="betterlog diagnose">
              <CLISnippet />
            </PanelChrome>

            <p className="mt-4 font-mono text-[11.5px] leading-[1.5] text-[var(--color-muted)]">
              OTel-native · BYOK LLM · open standards · zero lock-in
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CLISnippet() {
  return (
    <pre className="overflow-x-auto bg-[var(--color-void)] p-5 font-mono text-[12.5px] leading-[1.65] text-[var(--color-concrete)]">
      <code>
        <span className="text-[var(--color-muted)]">$ </span>
        <span>betterlog diagnose order-1234</span>
        {"\n\n"}
        <span className="text-[var(--color-muted)]">workflow   </span>
        <span>order-fulfillment</span>
        <span className="text-[var(--color-muted)]">   status </span>
        <span className="text-[var(--color-alert)]">FAILED</span>
        {"\n"}
        <span className="text-[var(--color-muted)]">failed step </span>
        <span>sku-mapping</span>
        {"  "}
        <span className="text-[var(--color-muted)]">(0.843s)</span>
        {"\n"}
        <span className="text-[var(--color-muted)]">root cause  </span>
        <span>unmapped_sku</span>
        {"\n\n"}
        <span className="text-[var(--color-muted)]">similar failures (3)</span>
        {"\n"}
        <span className="text-[var(--color-muted)]">#1 </span>
        <span>order-0754</span>
        {"   "}
        <span>unmapped_sku</span>
        {"     "}
        <span className="text-[var(--color-trace)]">0.92</span>
        {"\n"}
        <span className="text-[var(--color-muted)]">#2 </span>
        <span>order-0321</span>
        {"   "}
        <span>unmapped_sku</span>
        {"     "}
        <span className="text-[var(--color-trace)]">0.88</span>
        {"\n"}
        <span className="text-[var(--color-muted)]">#3 </span>
        <span>order-0789</span>
        {"   "}
        <span>unmapped_sku</span>
        {"     "}
        <span className="text-[var(--color-trace)]">0.66</span>
        {"\n\n"}
        <span className="text-[var(--color-muted)]">suggested fix </span>
        <span className="text-[var(--color-trace)]">Add mapping for SKU: ABC-123</span>
        <span className="caret bg-[var(--color-concrete)]" />
      </code>
    </pre>
  );
}
