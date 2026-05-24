"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const SERVICES = [
  "Nuxt storefront",
  "Medusa API",
  "RabbitMQ",
  "OmniAPI · inventory",
  "OmniAPI · pricing",
  "back40 OMS",
  "Epicor ERP",
];

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]"
            >
              The 2&nbsp;AM problem
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
              An order failed. Now you&rsquo;re tailing logs across seven services.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-[520px] text-[16.5px] leading-[1.6] text-[var(--color-muted)]"
            >
              Datadog has the metrics. Sentry has the stack trace. Your queue dashboard has the
              throughput. But nobody has the answer to the actual question your CS team is asking:
              <em className="text-[var(--color-ink-82)] not-italic">
                {" "}
                what happened to this specific order?
              </em>
            </motion.p>

            <motion.ul
              ref={ref}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 space-y-3 text-[15px] text-[var(--color-ink-83)]"
            >
              {[
                "Workflows span 5–10 services. Logs span 5–10 dashboards.",
                "Correlation IDs exist in 60% of services — different names everywhere.",
                "AI agents add a new failure mode every week. Without observability, they're black boxes.",
              ].map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <span
                    aria-hidden
                    className="mt-[9px] inline-block h-1 w-3 shrink-0 rounded-full bg-[var(--color-ink-40)]"
                  />
                  {line}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Right: schematic of the painful path through services */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[16px] border border-[var(--color-cream-border)] bg-[var(--color-cream-soft)] p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[12px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  Without BetterLog
                </span>
                <span className="font-mono text-[11px] text-[var(--color-muted)]">~4h MTTR</span>
              </div>
              <div className="grid gap-2">
                {SERVICES.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.32, delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between rounded-[8px] border border-[var(--color-cream-border)] bg-[var(--color-cream)] px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full bg-[var(--color-ink-40)]"
                      />
                      <span className="text-[14px] text-[var(--color-ink)]">{s}</span>
                    </span>
                    <span className="font-mono text-[11.5px] text-[var(--color-muted)]">
                      {i === SERVICES.length - 1 ? "log dashboard #7" : `log dashboard #${i + 1}`}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 rounded-[8px] border border-dashed border-[rgba(164,69,58,0.35)] bg-[rgba(164,69,58,0.04)] px-3.5 py-3 text-[13.5px] text-[var(--color-danger)]">
                You still don&rsquo;t know which service stalled the order.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
