# Design — BetterLog

A locked design system for the BetterLog marketing site and future app surfaces.
Every page reads this file before emitting code.

**Positioning anchor** (from `docs/business_context.md`): case-level workflow
diagnosis via an explicit SDK contract — not "AI observability." The workflow
contract is the moat; plain-language answers serve engineers and ops alike.

## Genre

modern-minimal — Coral catalog theme. Warm peach paper, coral accent, geometric sans,
pill CTAs, N5 floating nav.

## Macrostructure family

- **Marketing pages:** Workbench — product demo (workflow graph + CLI artifact)
  carries the page; copy supports the demo, not the reverse.
- **App pages (future):** Workbench — function-first, no marketing enrichment.
- **Content pages (future):** Long Document — docs and guides, typography only.

## Theme — Coral

- `--color-paper`   oklch(98% 0.012 38) — warm near-white
- `--color-paper-2` oklch(96% 0.014 38)
- `--color-ink`     oklch(18% 0.02 38) — warm charcoal
- `--color-ink-2`   oklch(32% 0.018 38)
- `--color-rule`    oklch(90% 0.012 38)
- `--color-border`  oklch(82% 0.014 38) — structural borders
- `--color-accent`  oklch(62% 0.19 38) — coral, CTAs only
- `--color-trace`   oklch(58% 0.12 165) — success / ops highlights
- `--color-alert`   oklch(58% 0.20 28)  — failure states
- `--color-focus`   oklch(58% 0.20 38)
- `--color-void`    oklch(20% 0.022 38) — code surfaces, inverted bands

**Axes:** light paper · geometric-sans · warm coral accent

## Typography

Single-family tree tuned for Coral / modern-minimal — tight display, neutral body, mono for code only.

- **Display:** Inter Tight, weight 600, tracking -0.03em — headlines, wordmark, section titles
- **Body:** Inter, weight 400–500, tracking -0.01em — prose, nav, UI labels
- **Mono:** IBM Plex Mono, weight 400–500 — code blocks and CLI output only (not nav labels)
- **Display scale:** `--text-hero` hero · `--text-display` sections · `--text-4xl` cards

**Why not Space Grotesk:** mechanical grotesque reads brutalist; it fights warm Coral paper. Inter Tight + Inter is the catalog pairing for this theme cluster.

## Spacing

4-point named scale in `apps/web/tokens.css`. Section vertical rhythm uses
`--space-section` everywhere. Horizontal inset: `px-5 sm:px-8` inside
`max-w-[var(--container-content)]`.

## Motion

- Easings: `--ease-out`, `--ease-snap` for UI; snap not glide.
- Reveal: fade + 8px translate, once per section, ≤220ms.
- Reduced-motion: opacity-only, ≤150ms.

## Microinteractions stance

- Silent success on forms — no celebratory toasts.
- Hover: 1px outer ring on bordered controls (brutalist elevation).
- Tooltips: 800ms hover delay if added later.

## CTA voice

- **Primary:** filled `--color-accent` (coral), no border, 8px radius, 40px height.
- **Secondary:** white surface, `--color-border` outline, same geometry.
- **Nav:** N5 floating pill — detached, blur backdrop, soft shadow.
- Copy pattern: verb-first ("Join waitlist", "View demo").

## Per-page allowances

- Marketing: Tier-A CSS art only (CLI snippet, span timeline) — no fake browser chrome.
- App: no enrichment.
- No invented metrics — use real product facts or labelled placeholders.

## What pages MUST share

- Wordmark: BetterLog_ (underscore or caret in hero only).
- Accent placement: CTAs + focus rings + selected graph nodes only.
- Section header grid: title left, lede right, same column ratio on every section.
- Container width and section padding tokens.

## What pages MAY differ on

- Background band: paper vs void (final CTA only).
- Demo archetype within Workbench family.

## Exports

### tokens.css

See `apps/web/tokens.css`.

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper:   oklch(98% 0.012 38);
  --color-ink:     oklch(18% 0.02 38);
  --color-accent:  oklch(62% 0.19 38);
  --color-trace:   oklch(58% 0.12 165);
  --color-alert:   oklch(58% 0.20 28);
  --font-display:  var(--font-inter-tight), var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-body:     var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono:     var(--font-plex-mono), ui-monospace, monospace;
  --spacing-md:    1.5rem;
  --spacing-section: clamp(4rem, 8vw, 7rem);
  --text-display:  clamp(2.5rem, 5vw + 0.5rem, 4rem);
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper":  { "$value": "oklch(98% 0.012 38)", "$type": "color" },
    "ink":    { "$value": "oklch(18% 0.02 38)", "$type": "color" },
    "accent": { "$value": "oklch(62% 0.19 38)", "$type": "color" },
    "trace":  { "$value": "oklch(58% 0.12 165)", "$type": "color" },
    "alert":  { "$value": "oklch(58% 0.20 28)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Inter Tight", "$type": "fontFamily" },
    "body":    { "$value": "Inter", "$type": "fontFamily" },
    "mono":    { "$value": "IBM Plex Mono", "$type": "fontFamily" }
  },
  "space": {
    "section": { "$value": "clamp(4rem, 8vw, 7rem)", "$type": "dimension" },
    "md":      { "$value": "1.5rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background:         98% 0.012 38;
  --foreground:         18% 0.02 38;
  --primary:            62% 0.19 38;
  --primary-foreground: 99% 0.005 38;
  --muted:              90% 0.012 38;
  --muted-foreground:   52% 0.014 38;
  --border:             82% 0.014 38;
  --input:              82% 0.014 38;
  --ring:               58% 0.20 38;
  --radius:             8px;
}
```
