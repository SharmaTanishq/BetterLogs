"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { WaitlistForm } from "./waitlist-form";

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section className="relative border-t border-[var(--color-cream-border)] bg-[var(--color-cream)]">
      <div ref={ref} className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)] p-8 sm:p-14 lg:p-20">
          {/* atmospheric blob */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 196, 173, 0.5) 0%, rgba(255, 196, 173, 0) 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(178, 196, 235, 0.5) 0%, rgba(178, 196, 235, 0) 70%)",
            }}
          />

          <div className="relative mx-auto max-w-[640px] text-center">
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-semibold text-[var(--color-ink)]"
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                lineHeight: 1.04,
                letterSpacing: "-0.028em",
              }}
            >
              Stop reading logs. Start asking questions.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mx-auto mt-5 max-w-[520px] text-[17px] leading-[1.55] text-[var(--color-muted)]"
            >
              Join the BetterLog private beta. We&rsquo;re onboarding teams shipping cross-system
              and agent-driven workflows this fall.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="mx-auto mt-8 max-w-[460px]"
            >
              <WaitlistForm id="waitlist-bottom" variant="hero" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
