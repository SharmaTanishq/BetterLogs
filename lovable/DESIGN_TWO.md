---
brand:
  name: BetterLog
  tagline: AI-powered workflow diagnosis. Root cause. Context. Action.
  theme: brutalist_grid
  locked_kit: brand-kit-v2.png
  version: 1.1
surfaces:
  - cli
  - web_app
  - marketing_site
  - docs
  - dashboard
  - slides
  - email
palette:
  base:
    void: "#0B0D10"
    slate: "#1B1F26"
    concrete: "#E5E7EA"
    paper: "#F2F2EE"
    signal: "#2563EB"
    trace: "#00BB94"
    alert: "#FF4D2E"
  semantic:
    background: "#F2F2EE"
    surface: "#FFFFFF"
    surface_inset: "#E5E7EA"
    foreground: "#0B0D10"
    foreground_muted: "#1B1F26"
    foreground_subtle: "#6B6F76"
    border: "#0B0D10"
    border_hairline: "#1B1F2622"
    accent_primary: "#2563EB"
    accent_secondary: "#00BB94"
    danger: "#FF4D2E"
    success: "#00BB94"
    warning: "#FF4D2E"
    info: "#2563EB"
    code_bg: "#0B0D10"
    code_fg: "#E5E7EA"
font_sources:
  - id: google-fonts
    foundry: Google Fonts
    license: Open-source licenses, commonly SIL Open Font License 1.1
    source_url: https://fonts.google.com/
    best_for: body, ui, mono, multi-script, fast-implementation
    implementation_note: Use next/font/google or self-hosted official files. Default delivery path for Inter and IBM Plex Mono.
  - id: fontshare
    foundry: Fontshare / Indian Type Foundry
    license: ITF Free Font License / Fontshare EULA
    source_url: https://www.fontshare.com/
    best_for: body, ui, display, marketing, brand-accent
    implementation_note: Self-host official files via next/font/local. Recommended source for Space Grotesk-adjacent display (Cabinet Grotesk, Clash Display) and Satoshi/General Sans as Inter alternatives. Do not relicense Fontshare families as OFL.
  - id: the-league
    foundry: The League of Moveable Type
    license: SIL Open Font License 1.1
    source_url: https://www.theleagueofmoveabletype.com/
    best_for: display, editorial, brand-accent
    implementation_note: Use for display/accent treatments (e.g., League Spartan) when a more industrial display register is needed. Preserve OFL text with bundled files.
typography:
  display:
    fontFamily: Space Grotesk
    weights: [500, 700]
    tracking: "-0.02em"
    case: sentence and trademark-cased
    sourceId: google-fonts
    sourceStatus: primary
    alternativeSourceId: fontshare
    alternativeFontFamily: Cabinet Grotesk
    role: Wordmark, hero statements, section headers
    personality: Geometric, mechanical, slightly engineered. Carries the brutalist grid voice.
  body:
    fontFamily: Inter
    weights: [400, 500, 600]
    tracking: "0"
    sourceId: google-fonts
    sourceStatus: primary
    alternativeSourceId: fontshare
    alternativeFontFamily: Switzer
    role: UI, paragraphs, labels, navigation
    personality: Neutral workhorse. Stays out of the way of structure and data.
  mono:
    fontFamily: IBM Plex Mono
    weights: [400, 500]
    tracking: "0"
    sourceId: google-fonts
    sourceStatus: primary
    alternativeSourceId: fontshare
    alternativeFontFamily: JetBrains Mono (via official source) or Fontshare Mono alternative
    role: Code, CLI output, annotations, index numbers, axis labels, system metadata
    personality: Engineering provenance. Signals truth, traces, and machine output.
  eyebrow:
    fontFamily: IBM Plex Mono
    weights: [500]
    tracking: "0.12em"
    case: UPPERCASE
    sourceId: google-fonts
    sourceStatus: primary
    alternativeSourceId: the-league
    alternativeFontFamily: League Spartan (UPPERCASE small caps treatment)
    role: Section numerals (001, 002…), captions, marginalia
radius:
  none: 0px
  xs: 2px
  sm: 4px
  pill: 999px
  rule: Default to 0. Use 2–4px only on interactive chrome (buttons, chips, inputs). Pill only for status dots and filter chips.
spacing:
  scale: [4, 8, 12, 16, 24, 48, 64]
  gutter: 24
  section: 64
  hairline: 1
shadow:
  none: none
  hover: 0 0 0 1px #0B0D10
  press: inset 0 0 0 1px #0B0D10
motion:
  duration_fast: 80ms
  duration_base: 140ms
  duration_slow: 220ms
  easing: cubic-bezier(0.2, 0, 0, 1)
  philosophy: Snap, do not glide. No bounce, no parallax, no gradients in motion.
---

# DESIGN.md

## Overview

BetterLog is an AI-powered workflow diagnosis platform built on OpenTelemetry. It maps raw traces onto named business workflows so platform engineers and ops teams share one explanation of what failed, why, and what to do next. The brand needs to feel like an engineering instrument: precise, legible, honest, and built for people who read terminal output as comfortably as a dashboard.

The visual system is **brutalist grid**. Heavy black rules, monospaced metadata, plate-numbered sections, and an unsentimental neutral background. Color is restrained and load-bearing — it only appears when the system has something to say.

- **Source of truth:** the locked brand kit image `brand-kit-v2.png`.
- **Intended surfaces:** CLI, web app (react-flow workflow graph, diagnosis views), docs, marketing site, slides, email, and embedded snippets.
- **Continuity from v1 → v2:** the brutalist grid armature is preserved; v2 sharpens the system around the actual product — CLI diagnosis, workflow graphs, business keys, and OTel provenance.

The brand kit image is the visual source of truth. Where this document and the image disagree, the image wins.

## Content Fundamentals

**Voice.** Diagnostic. Plain. We name things by their business identity (order, invoice, shipment), never by span IDs. We explain causes in one sentence and propose one next action.

**Tone.** Calm under failure. We do not perform alarm. Red is reserved for the alert state; the rest of the time we are a steady instrument.

**Casing.**
- Wordmark: `BetterLog` (camel, no space).
- Section headers and eyebrows: `UPPERCASE` with mono tracking `+0.12em`.
- UI labels: Sentence case. Buttons are imperative verbs (`Run Diagnosis`, `View Workflow`, `Copy Command`).
- Code, IDs, step names: lowercase snake_case in mono (`order_id`, `unmapped_sku`, `authorise-payment`).

**Punctuation quirks.**
- Trailing underscore cursor `_` is permitted after the wordmark in hero contexts, never inside paragraphs.
- Three-beat taglines use periods, not commas: `Root cause. Context. Action.`
- No exclamation points. No em-dash drama in UI copy.

**Emoji stance.** None in product UI, marketing, or docs. Status is communicated by color dot + text, never by emoji.

**Naming patterns.** Workflows are nouns (`order-fulfillment`). Steps are verbs (`reserve-inventory`). Business keys are typed chips (`order_id:1234`).

**Concrete examples.**
- Button label: `Run Diagnosis` — not "Let's go" or "Diagnose now!".
- Error: `Unmapped SKU detected on step sku-mapping. Add mapping for SKU: ABC-123.`
- Empty state: `No diagnoses yet. Run \`betterlog diagnose <business_key>\` to begin.`

## Visual Foundations

**Canvas.** Paper neutral `#F2F2EE` with a faint mechanical texture is the default ground. Pure white `#FFFFFF` is reserved for inset surfaces (cards, inputs, panels). Void `#0B0D10` is used for code, CLI, and data-viz canvases.

**Grid.** Twelve-column grid with a visible hairline frame on marketing and identity surfaces. Section plates are numbered in mono (`001`, `002`, …) at the top-left of each block. Vertical edge labels (`BETTERLOG / BRUTALIST_GRID`) appear in mono `+0.16em` tracking on full-bleed compositions only.

**Color usage.**
- **Void / Slate** carry the system. Text, borders, and code surfaces.
- **Concrete** is the resting inset — chips, secondary surfaces, swatch grounds.
- **Signal (`#2563EB`)** is the single primary action color. Use sparingly: primary buttons, current step, focus rings.
- **Trace (`#00BB94`)** marks success, healthy spans, and "this is the path that worked."
- **Alert (`#FF4D2E`)** is failure only. Never decorative. If alert is on screen, something is wrong.
- Never combine signal + trace + alert as a decorative palette. They are diagnostic, not ornamental.

**Type rhythm.** Display sets the mood (Space Grotesk, tight tracking, large). Body holds the room (Inter, 14–16px). Mono carries provenance (IBM Plex Mono, 11–13px, often uppercase for eyebrows). Hierarchy is built through scale jumps (12 → 16 → 24 → 48 → 96), not weight stacks.

**Borders.** A 1px solid `#0B0D10` is the brand's primary structural element. Dashed `1px` borders (`4 4` dash array) signal scaffolding, draft, or container regions. Hairlines `#1B1F2622` are allowed inside dense data tables only.

**Shadows.** Effectively none. Elevation is shown by a hard 1px black ring (`box-shadow: 0 0 0 1px #0B0D10`) on hover, or by stacking on the concrete inset. No soft drop shadows.

**Transparency and blur.** Not part of the system. No glass, no frosted panels, no gradient washes.

**Corner radii.** `0px` is the default. `2–4px` allowed on interactive chrome. `999px` only for status dots and filter chips.

**Imagery vibe.** High-contrast architectural photography (concrete, steel, ribbed facades), code on void backgrounds, and trace-data visualizations (orange/blue/green spans on void). Never stock photos of people pointing at laptops.

**Hover.** Background does not change; border thickens to a black ring. Cursor → `pointer`. Mono labels may reveal a `_` cursor blink at the end on hovered CTAs.

**Press.** Inset 1px ring, 1px translate down, duration 80ms.

**Focus.** 2px Signal outline, offset 2px. Never removed.

**Layout rules.**
- Asymmetry over symmetry. One large gesture per screen (a hero wordmark, a graph, a CLI block), surrounded by quieter modular blocks.
- Plate numbers (`001`, `002`) anchor sections in the top-left, eyebrow label to their right.
- The bottom-right of full compositions carries a small crop-mark and version tag (`v1.1`).

## Iconography And Assets

**Icon system.** 1.5px stroke, square caps, square joins, 20px or 24px grid. Geometric and orthogonal — favor right angles over curves. Treat icons like schematics, not illustrations. Substitution-needed: there is no shipped icon set in the brand kit; pair with **Lucide** as a baseline and override the few brand-critical glyphs (workflow node, step, span, trace) with custom 1.5px schematics.

**Status marks.**
- Success: filled `#00BB94` dot, 8px.
- Failed: filled `#FF4D2E` dot, 8px.
- In Progress: ringed Signal dot, 8px outer / 4px inner.
- Skipped: hollow Slate dot, 8px.

**Illustration treatment.** Wireframe diagrams over photographic illustration. Architecture crops (board tile *Structural Clarity*) and span-bar visualizations (board tile *Data As Truth*) are the two approved image registers. Avoid 3D renders, gradients, characters, mascots.

**Logo status.**
- The wordmark `BetterLog` set in Space Grotesk Bold with a trailing `_` is the locked treatment shown in the kit.
- No standalone logomark / monogram has been finalized. Inferred lockup for square avatars: `BL_` in Space Grotesk Bold on void. Flag as **substitution-needed** until an official mark is delivered.

**Assets to source later.**
- Official SVG wordmark (light + dark).
- Favicon and app icon set (16, 32, 180, 512).
- OG / social card templates.
- Custom workflow / step / span / trace icons.

## Components

**Buttons.**
- *Primary:* `#2563EB` background, white label, 1px `#0B0D10` border, 2px radius, 12/16 padding, Inter 500. Hover: `0 0 0 1px #0B0D10` outer ring. Active: 1px translateY.
- *Secondary:* white surface, 1px black border, black label.
- *Ghost / Copy:* white surface, 1px black border, label + small mono affordance (e.g., trailing copy glyph). Used for `Copy Command`.
- All buttons are rectangular. No pill buttons.

**Inputs.**
- White surface, 1px black border, 0 radius, 12/14 padding.
- Mono placeholder prefixed with `>` for command-style fields: `> betterlog diagnose order-1234`.
- Helper line below in mono, e.g. `Press ↵ to run`.
- Focus: 2px Signal outline, offset 2px.

**Segmented control.**
- Single row, 1px black frame, internal 1px dividers.
- Active segment: void fill, white label. Inactive: paper, black label.
- Used for `Workflow / Step / Span` switching in the graph view.

**Chips.**
- *Data chip:* concrete fill, 1px black border, mono label `order_id:1234`, dismiss `×` at right. 2px radius.
- *Status chip:* status dot + Inter 500 label, transparent fill, 1px border. Variants: Success, Failed, In Progress, Skipped.
- *Filter add:* dashed border `+ Add filter`.

**Cards / Panels.**
- White or concrete surface, 1px black border, 0 radius.
- Section number in mono eyebrow at top-left, label uppercase mono next to it.
- No nested cards. If hierarchy is needed, use a horizontal rule, not a new card.

**Navigation.**
- Top bar: paper background, 1px bottom rule. Wordmark left, mono section links center, primary action right.
- Side nav: concrete column, 1px right rule, mono section labels in `UPPERCASE +0.12em`.

**Progress indicator (diagnosis pipeline).**
- Horizontal line of numbered nodes: Collecting → Analysing → Generating → Complete.
- Current node: Signal fill, white numeral. Completed: void fill. Upcoming: paper fill with 1px border. Connector: 1px black rule.

**Alerts / Callouts.**
- Void background, white text, 1px black border. Left mark: alert dot. Right action: inline button.
- Example: `● Unmapped SKU detected     [ View ]`
- No tinted background alerts. Severity is encoded in the dot color, not the panel fill.

**Dashboard tiles.**
- 1px framed modules on the paper canvas.
- Top-left: plate number + label. Bottom-right: optional numeric KPI in Space Grotesk.
- Workflow graph tile: void background; nodes are 1px-bordered rectangles, failed node in alert, current in signal, healthy in trace.

**Code / CLI block.**
- Void background, IBM Plex Mono, 13px, `#E5E7EA` fg.
- Command prompt `$` prefix, output uses muted gray with token highlights: `FAILED` in alert, `0.92` similarity in mono accent, `Add mapping for SKU: ABC-123` in trace.
- 1px black border on light surfaces; no border when full-bleed on void.

**Tabs.** Underline tabs only. 2px void rule under active label; 1px hairline beneath the row.

## UI Kit Guidance

**A typical product screen — Diagnosis view.**
- Paper canvas. Top bar with wordmark and mono section path: `WORKSPACE / WORKFLOWS / order-fulfillment`.
- Left rail (concrete): workflow list with mono business keys.
- Main column split: top quarter is the CLI-style summary block (void), the rest is the react-flow workflow graph (void canvas, 1px-bordered nodes, failed node in alert, edges in 1px white).
- Right rail (white): the LLM diagnosis card — plain-language summary, similar failures list with mono IDs and similarity scores, and a single primary `Apply Fix` button in Signal.
- Footer status strip: mono, hairline top rule, shows OTel collector status and last sync.

**Marketing.** Hero is the wordmark at extreme scale with the three-beat tagline beneath in Inter. One feature per screen-section, each anchored by a plate number and one finished artifact (CLI snippet, graph crop, code annotation example). No carousels. No customer-logo soup.

**Web app.** Density is intentional. Tables over cards when data is comparative. Workflow graph is the hero artifact; everything else is metadata. Avoid color decoration in chrome; reserve Signal, Trace, and Alert for diagnostic meaning.

**Mobile.** Single column. Plate numbers shrink but remain. CLI block becomes horizontally scrollable; do not reflow code. Primary action is full-width Signal button, pinned bottom with a 1px top rule.

**Docs.** Two-column: mono left-rail TOC, Inter body right. Code blocks on void. Inline code in Plex Mono with concrete background and 2px radius. Callouts use the alert/void pattern above; no colored-left-border admonitions.

**Slides.** 16:9 paper canvas, plate number top-left, vertical mono label `BETTERLOG / BRUTALIST_GRID` on the spine, one idea per slide, one artifact per slide. Display type at 96–160px. Footer rule with `v1.1` and a small crop tick bottom-right.

**Do not invent.** No bluish-purple gradients. No emoji-fronted feature cards. No colored-left-border alert cards. No tilted device mockups. No 3D isometric scenes. No soft glassmorphism.

## Preview And Verification Notes

Downstream agents should generate the following small, self-contained preview cards to verify the system before any production render.

**Type previews.**
- Display specimen: `Ag` in Space Grotesk Bold at 240px on paper.
- UI specimen: a 3-line paragraph in Inter 16/24 — *"Make sense of what actually happened."*
- Mono specimen: the four-line `@workflow` snippet from the kit (`@workflow(name="order-fulfillment", service="checkout")` …).

**Color previews.**
- Six full-bleed swatches with name + hex in mono caption: Void, Slate, Concrete, Signal, Trace, Alert.
- Pairing chips: white-on-Void, white-on-Signal, white-on-Alert, void-on-Trace. Each must pass AA at body size.

**Spacing previews.**
- Square stack at 4 / 8 / 12 / 16 / 24 / 48 / 64.
- Gutter demo: two 1px-bordered tiles with a 24px gutter between them.

**Component previews.**
- Buttons row: Primary, Secondary, Ghost (each with default / hover / pressed / focus).
- Status chips row: Success, Failed, In Progress, Skipped.
- Segmented control: Workflow / Step / Span.
- Input: `> betterlog diagnose order-1234` with `Press ↵ to run` helper.
- Alert: `● Unmapped SKU detected   [ View ]` on void.
- Progress indicator: 4-node diagnosis pipeline with node 2 active.

**Brand previews.**
- Wordmark lockup on paper and on void.
- One workflow graph mini-tile (void canvas, three nodes, one failed in alert).
- One CLI mini-tile reproducing the `betterlog diagnose order-1234` output.

Each preview should sit in a 1px black frame with a plate number and a short uppercase mono label.

## Caveats And Missing Assets

- **Fonts** are inferred from the kit's visual character: Space Grotesk (display), Inter (UI), IBM Plex Mono (mono). All three render close to the artifact, but exact spec confirmation is pending. Approved non-Google alternatives are listed in `font_sources` (Fontshare for Cabinet Grotesk / Switzer display + UI swaps; The League of Moveable Type for an industrial display register such as League Spartan).
- **Logo / mark.** Only the wordmark lockup is present. A standalone monogram, favicon, and app-icon set are **substitution-needed**.
- **Icon set.** No official icon family in the kit. Lucide is a reasonable interim; brand-critical glyphs (workflow, step, span, trace) need custom drawings.
- **OG / social templates, email templates, slide master** are not in the kit and should be produced from the rules in this document.
- **Texture / paper grain.** The kit suggests a subtle mechanical noise on the canvas. Treat as inferred — keep it under 4% opacity and never let it touch typography.
- **Motion specs** beyond the snap principle are inferred; refine once real interactive screens exist.
- **Photography library.** Architectural and data-bar imagery is implied by the art-direction tiles but no asset library ships with the kit. Curate against the *Structural Clarity* and *Data As Truth* tile references.

## Downstream Skill Guidance

Read this `DESIGN.md` before producing any BetterLog artifact. Design to this brand, not to a generic design system. Specifically:

1. **Honor the brutalist grid.** 1px black rules, plate numbers, mono eyebrows, asymmetric editorial composition, paper canvas. Do not soften it with rounded cards, drop shadows, or gradients.
2. **Use color as diagnosis, not decoration.** Signal, Trace, and Alert only appear when they mean something. Default surfaces are paper, white, concrete, and void.
3. **Copy the available assets.** Use the wordmark exactly as shown in `brand-kit-v2.png`. When assets are missing (mark, icons, OG), use the substitutions named here and flag the substitution in your output.
4. **Preserve `font_sources` metadata** when bundling or self-hosting fonts. Google Fonts remains a valid delivery path; Fontshare and The League are the approved non-Google alternatives. Do not relicense Fontshare families as OFL. Keep each foundry's license text alongside its font files.
5. **Ask for exact sources** when pixel accuracy depends on assets not provided — specifically the official wordmark SVG, the custom icon set, and any motion specs beyond the snap defaults documented here.
6. **When in doubt, choose the more honest, more legible, more rectangular option.** That is the brand.
