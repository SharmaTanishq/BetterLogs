"use client";

import { motion } from "motion/react";
import { Github } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./button";

const SECTIONS = [
  { id: "002", href: "#diagnose", label: "DIAGNOSE" },
  { id: "003", href: "#two-views", label: "TWO_VIEWS" },
  { id: "004", href: "#how-it-works", label: "HOW_IT_WORKS" },
  { id: "005", href: "#built-for", label: "BUILT_FOR" },
];

export function Nav() {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      className="sticky top-0 z-40 border-b border-[var(--color-foreground)] bg-[var(--color-background)]/95 backdrop-blur-[1px]"
    >
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <a href="#" aria-label="BetterLog home" className="inline-flex items-center">
          <Logo size={18} />
        </a>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Primary"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="group inline-flex items-baseline gap-2 font-mono text-[11px] text-[var(--color-foreground-subtle)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-foreground)]"
            >
              <span className="text-[var(--color-foreground-subtle)] group-hover:text-[var(--color-foreground)]">
                {s.id}
              </span>
              <span className="uppercase tracking-[0.12em]">{s.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="BetterLog on GitHub"
            className="inline-flex h-9 w-9 items-center justify-center border border-transparent text-[var(--color-foreground)] transition-[border-color] duration-[var(--motion-base)] hover:border-[var(--color-foreground)]"
          >
            <Github className="h-[16px] w-[16px]" strokeWidth={1.6} />
          </a>
          <Button as="a" href="#waitlist" variant="primary" size="sm">
            Join Waitlist
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
