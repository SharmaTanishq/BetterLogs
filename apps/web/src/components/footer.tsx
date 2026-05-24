import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-cream-border)] bg-[var(--color-cream)]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="text-[12.5px] text-[var(--color-muted)]">
            &copy; {new Date().getFullYear()} BetterLog
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
          {[
            ["GitHub", "https://github.com"],
            ["Docs", "#"],
            ["Privacy", "#"],
            ["Contact", "mailto:hello@betterlog.dev"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-[13.5px] text-[var(--color-ink-83)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
