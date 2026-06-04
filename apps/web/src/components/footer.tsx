import { Logo } from "./logo";

const GITHUB_URL = "https://github.com/SharmaTanishq/BetterLogs";
const DOCS_URL = `${GITHUB_URL}/blob/main/docs/sdk-getting-started.md`;
const SDK_URL = `${GITHUB_URL}/tree/main/packages/sdk-node`;

export function Footer() {
  return (
    <footer className="bg-[var(--color-paper)]">
      <div className="mx-auto max-w-[var(--container-content)] px-5 sm:px-8">
        <div className="grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:justify-between md:gap-16">
          <div className="min-w-0">
            <Logo size={24} />
            <p className="mt-4 max-w-[28rem] text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Case-level workflow diagnosis on OpenTelemetry. Engineers declare the
              contract; ops get the answer without trace literacy.
            </p>
          </div>

          <nav
            className="grid min-w-0 grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-3"
            aria-label="Footer"
          >
            <FooterCol
              title="Product"
              links={[
                ["SDK", SDK_URL],
                ["CLI", GITHUB_URL],
                ["Waitlist", "#waitlist"],
              ]}
            />
            <FooterCol
              title="Resources"
              links={[
                ["Docs", DOCS_URL],
                ["GitHub", GITHUB_URL],
                ["Architecture", `${GITHUB_URL}/blob/main/docs/architecture.md`],
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                ["Contact", "mailto:hello@betterlog.dev"],
              ]}
            />
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] py-4 text-[12px] text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} BetterLog</span>
          <span className="font-mono text-[11px]">OTel-native · zero lock-in · self-hostable</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  const isExternal = (href: string) => href.startsWith("http") || href.startsWith("mailto:");

  return (
    <div className="min-w-0">
      <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink)]">
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              {...(isExternal(href)
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
              className="inline-flex min-h-11 items-center text-[13.5px] text-[var(--color-muted)] underline-offset-4 transition-colors hover:text-[var(--color-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
