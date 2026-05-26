import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-[var(--color-background)]">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Top rule + colophon row */}
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <Logo size={28} caret />
            <p className="max-w-[420px] font-mono text-[12px] text-[var(--color-foreground-subtle)]">
              AI-powered workflow diagnosis. Root cause. Context. Action.
            </p>
          </div>

          <nav
            className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3"
            aria-label="Footer"
          >
            <FooterCol
              title="PRODUCT"
              links={[
                ["SDK", "#"],
                ["CLI", "#"],
                ["Web app", "#"],
                ["Waitlist", "#waitlist"],
              ]}
            />
            <FooterCol
              title="RESOURCES"
              links={[
                ["Docs", "#"],
                ["GitHub", "https://github.com/"],
                ["Changelog", "#"],
                ["Security", "#"],
              ]}
            />
            <FooterCol
              title="COMPANY"
              links={[
                ["Contact", "mailto:hello@betterlog.dev"],
                ["Privacy", "#"],
                ["Terms", "#"],
              ]}
            />
          </nav>
        </div>

        {/* Bottom strip */}
        <div className="flex flex-col gap-2 border-t border-[var(--color-foreground)] py-4 font-mono text-[11px] text-[var(--color-foreground-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <span>BETTERLOG / BRUTALIST_GRID · v1.1</span>
          <span>&copy; {new Date().getFullYear()} BetterLog. OTel-native. Zero lock-in.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-foreground)]">
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="font-sans text-[13.5px] text-[var(--color-foreground-muted)] underline-offset-4 transition-colors hover:text-[var(--color-foreground)] hover:underline"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
