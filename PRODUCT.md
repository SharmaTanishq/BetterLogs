# Product

## Register

product

## Users

**Engineers (installers and champions):** Platform or infrastructure engineers at mid-size SaaS teams (50–500 engineers) who own OTel pipelines and cross-service workflows. They add `@workflow` + `recordStep()` annotations to reduce ops-to-engineering interrupt loops. Context: deep in distributed systems, skeptical of hype, values explicit contracts over inferred magic.

**Ops (daily readers):** Operations team members at e-commerce, logistics, fintech, or B2B SaaS companies who do not read traces or logs. They need case-level answers: what failed, why, what to do, whether it happened before. Context: Slack-driven escalations today; BetterLog should feel like a trustworthy answer, not another dashboard to learn.

Both audiences share one product surface. Engineers install; ops read. Design must serve both without dumbing down for either.

## Product Purpose

BetterLog is case-level workflow diagnosis built on OpenTelemetry. Engineers declare workflow shape explicitly via an SDK contract; the platform stitches spans into named, ordered workflows keyed to business identifiers (`order_id`, `invoice_id`, `run_id`). When a cross-system workflow fails, anyone on the team can answer "what happened to X?" in plain language without reading raw traces.

Success looks like: one team instruments one workflow they own and gets value the same day; ops resolves cases without paging engineering; the workflow contract (not AI novelty) is what makes the diagnosis trustworthy.

## Brand Personality

**Sharp · Warm · Human**

- **Sharp:** Precise language, confident typography, no filler. Show the contract and the demo; let the product prove itself.
- **Warm:** Approachable for ops readers; serious tool that does not feel cold or enterprise-bloated.
- **Human:** Plain-language failure summaries, business-key framing, respect for the person waiting on an answer.

Reference lane: Linear and Raycast — crisp product UI, restrained motion, confident typography. Developer trust without observability-category density.

## Anti-references

- **Generic SaaS landing:** Cream paper backgrounds, gradient text, hero metrics, eyebrow kickers on every section, identical icon-card grids.
- **AI observability cliché:** "AI SRE" positioning, purple gradients, chatbot mascots, vague superlatives, commoditized "AI-powered" framing.
- **Enterprise observability bloat:** Datadog-style density, trace jargon as default voice, salesy enterprise chrome.

BetterLog is a thin diagnosis layer on top of existing OTel backends — not another APM platform, not a workflow orchestrator, not a no-code builder.

## Design Principles

1. **Show the contract, not the pitch.** The workflow graph and SDK demo carry credibility. Copy supports the demo; the demo does not decorate the copy.
2. **Case-level clarity.** Every surface answers "what happened to X?" in language ops already uses — step names, business keys, root cause — not span IDs and latency percentiles.
3. **Two audiences, one system.** Engineer-facing surfaces (SDK, CLI, instrumentation) and ops-facing surfaces (timeline, summaries) should feel like the same product, not two products stitched together.
4. **Restraint over category reflex.** Reject default SaaS and AI-observability patterns. If it could belong on any developer-tool landing page, it does not belong here.
5. **Trust is the product.** Diagnosis only works if the timeline is deterministic and the UI feels as reliable as the explicit workflow contract underneath.

## Accessibility & Inclusion

- **Baseline:** WCAG 2.1 AA — contrast, visible focus states, keyboard navigation, semantic structure.
- **Ops readability:** Plain language by default; status colors that remain distinguishable for common color-vision deficiencies; consider larger type options on diagnosis and timeline views.
- **Motion:** Respect `prefers-reduced-motion`; opacity-only fallbacks for reveals (already established in DESIGN.md).
- **Forms and CTAs:** Verb-first labels with standalone meaning; silent success on forms (no celebratory toasts).
