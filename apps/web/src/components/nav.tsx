"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Github, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./button";

const GITHUB_URL = "https://github.com/SharmaTanishq/BetterLogs";

const LINKS = [
  { href: "#diagnose", label: "Diagnose" },
  { href: "#two-views", label: "Compare" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#built-for", label: "Who it's for" },
];

export function Nav() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeMenu = () => {
    dialogRef.current?.close();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const unlockScroll = () => {
      document.body.style.overflow = "";
    };

    dialog.addEventListener("close", unlockScroll);
    return () => {
      dialog.removeEventListener("close", unlockScroll);
      unlockScroll();
    };
  }, []);

  const openMenu = () => {
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  };

  return (
    <>
      <div className="nav-pill-spacer" aria-hidden />
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="nav-pill"
      >
        <a href="#" aria-label="BetterLog home" className="inline-flex shrink-0 items-center pr-1">
          <Logo size={16} />
        </a>

        <nav className="hidden min-w-0 items-center md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex h-8 items-center whitespace-nowrap px-2.5 font-sans text-[13px] font-medium text-[var(--color-muted)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 pl-1">
          <button
            type="button"
            onClick={openMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-input)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] md:hidden"
            aria-label="Open menu"
            aria-haspopup="dialog"
          >
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="BetterLog on GitHub"
            className="hidden h-11 w-11 items-center justify-center rounded-[var(--radius-input)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] sm:inline-flex"
          >
            <Github className="h-4 w-4" strokeWidth={1.6} />
          </a>
          <Button as="a" href="#waitlist" variant="primary" size="sm">
            Join waitlist
          </Button>
        </div>
      </motion.header>

      <dialog
        ref={dialogRef}
        className="nav-mobile-dialog m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-[var(--color-ink)]/40 open:flex open:items-stretch open:justify-end"
        aria-label="Site menu"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeMenu();
        }}
      >
        <div className="flex min-h-dvh w-full max-w-[20rem] flex-col border-l border-[var(--color-border)] bg-[var(--color-paper)] shadow-[var(--shadow-nav)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <Logo size={18} />
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-input)] text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col px-3 py-4" aria-label="Mobile primary">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-input)] px-3 font-sans text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="space-y-2 border-t border-[var(--color-border)] p-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
              className="inline-flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-input)] px-3 font-sans text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            >
              <Github className="h-4 w-4" strokeWidth={1.6} />
              View on GitHub
            </a>
            <Button as="a" href="#waitlist" variant="primary" size="md" className="w-full" onClick={closeMenu}>
              Join waitlist
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
