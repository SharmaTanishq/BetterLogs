"use client";

import { motion } from "motion/react";
import { Github } from "lucide-react";
import { Logo } from "./logo";

export function Nav() {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <a href="#" aria-label="BetterLog home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          <a
            href="#how-it-works"
            className="text-[14px] text-[var(--color-ink-83)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
          >
            How it works
          </a>
          <a
            href="#workflows"
            className="text-[14px] text-[var(--color-ink-83)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
          >
            Workflows
          </a>
          <a
            href="#waitlist"
            className="text-[14px] text-[var(--color-ink-83)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
          >
            Waitlist
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="BetterLog on GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-ink-83)] transition-colors hover:bg-[var(--color-ink-04)] hover:text-[var(--color-ink)]"
          >
            <Github className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </a>
          <a
            href="#waitlist"
            className="shadow-inset-dark inline-flex h-9 items-center rounded-md bg-[var(--color-ink)] px-3.5 text-[14px] text-[var(--color-cream-soft)] transition-opacity hover:opacity-90 active:opacity-80"
          >
            Join waitlist
          </a>
        </div>
      </div>
    </motion.header>
  );
}
