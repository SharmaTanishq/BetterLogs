# Business Context

## Product or Service

BetterLog is an AI-powered workflow diagnosis platform built on OpenTelemetry. It surfaces root causes of cross-service workflow failures with enough clarity that both engineers and non-technical ops teams can understand what went wrong and what to do next.

**SDK Design:**
- Engineers annotate their code with `@workflow(name, service)` and `recordStep()` calls. This creates an explicit, ordered workflow contract — step sequence is declared at instrumentation time, not inferred from span timestamps or parentage.
- This thin semantic layer emits standard OTel spans underneath, so it plugs into existing collectors (Jaeger, Tempo, Datadog, etc.) without replacing them.
- The explicit contract makes the AI agent's diagnosis deterministic and makes the visual graph trustworthy for non-engineers. Ops see step names they recognize, not internal span IDs.
- Future: ops-defined custom workflow nodes with SDK-assigned IDs (v2, post-traction).

**MVP (CLI):**
- Backend stitches `@workflow`-tagged spans into a structured workflow object with ordered steps and business keys (`order_id`, `invoice_id`, etc.).
- CLI: `betterlog diagnose order-1234` returns the failed step, root cause, similar past failures (pgvector similarity), and an actionable fix suggestion.
- Single LLM agent (BYOK — OpenAI, Anthropic, or Ollama) driving diagnosis via a fixed tool set (`get_workflow`, `find_similar_failures`, etc.).

**Planned Web App (post-MVP):**
- Visual workflow graph (react-flow) rendered automatically from `@workflow` + `recordStep()` data. Each node is a step; failed nodes show root cause and fix inline. No manual diagram setup required.
- Organisation and user management — engineers and ops share a workspace. Ops users read the graph; engineers act on it.
- Plain-language failure summaries throughout — no trace jargon, business-key framing (order IDs, step names ops already know).
- Future v2: ops can define expected workflow shapes in the UI; SDK node IDs map to those definitions, enabling deviation detection before failures.

**Key differentiator from Datadog/Honeycomb:** Those tools surface raw traces for engineers. BetterLog maps traces onto named business workflows and presents failures in terms ops teams understand — not spans and latency percentiles, but "step X failed because of Y, here is the fix." Different user, different job to be done.

## ICP

**Two-layer ICP:**

**Buyer / internal champion:** Platform or infrastructure engineer at a mid-size SaaS (50–500 engineers).
- Owns the OTel pipeline; adoption requires adding `@workflow` + `recordStep()` annotations — low effort, not a full re-instrumentation.
- Gets paged on workflow failures; wants faster RCA for themselves first.
- Champions BetterLog internally because it reduces ops-to-engineering escalations.

**Primary daily user (post-web-app):** Operations team member at an e-commerce, logistics, or B2B SaaS company.
- Does not read traces or logs.
- Needs to know: what failed, why, what to do, whether it has happened before.
- Currently waits on engineers to interpret failures — BetterLog removes that bottleneck.

**Entry segment:** E-commerce and logistics platforms with high-frequency order fulfillment workflows. Failures are frequent, revenue-impactful, and pattern-repeating (SKU mapping errors, carrier rejections, inventory mismatches).

## Mission

To give every team — engineers and ops alike — immediate, actionable clarity on why a cross-service workflow failed, without requiring anyone to become a distributed tracing expert.

## Go-To-Market Strategy

**Wedge:** E-commerce order fulfillment failures. High failure rate, clear business impact, concrete demo. Targets platform engineers at mid-size e-commerce SaaS as the initial champion.

**Distribution:** Open-source core (SDK + CLI) drives bottom-up adoption among engineers. Paid hosted backend and web app converts teams that want managed infra and the ops-facing UI.

**GTM motion:**
1. Publish open-source SDK + CLI. Target OTel community (CNCF Slack, OTel SIG, Hacker News).
2. Sign 3–5 design partners in e-commerce/logistics SaaS — teams with both an engineering owner and an ops team handling fulfillment failures.
3. Use design partner outcomes (MTTR reduction, escalations avoided) as conversion case studies.
4. Web app expands from engineer tool to team-wide platform — increases seat count, raises ACV.

**Key objection:** "We already have Datadog." Counter: Datadog serves engineers reading traces. BetterLog serves the ops team getting the Slack message when order-1234 fails.

## Business Model

- **Open-source core:** SDK and CLI are free. Builds trust, drives instrumentation adoption.
- **Paid hosted backend:** Managed stitching, storage, pgvector index, LLM query layer, and web app. Pricing TBD — likely usage-based (workflow volume) with per-seat pricing for the web app tier.
- **Self-hosted option:** Full stack deployable in customer's own cloud. Commercial license for regulated industries.
- **BYOK LLM:** Customer supplies OpenAI/Anthropic/Ollama key. Removes AI cost from BetterLog's margin; eliminates data residency objections.

**Conversion trigger (open-source → paid):** Visual workflow web app, org/user management for ops access, managed infra.

## Business Classification
- Company Type: B2B SaaS / Open-Source Commercial
- Industry: Developer Tools / Observability / Workflow Operations
- User Type: Platform Engineers (buyer) + Ops Teams (daily user)

## Company Values
- Transparency first: surface what is actually happening, in terms every stakeholder understands.
- Zero lock-in: build on open standards (OTel); no proprietary agents or formats required.
- Actionability over noise: every diagnosis ends with a concrete next step.
- Security by default: BYOK, self-hostable, minimal data egress are first-class product decisions.
- Designed for humans: clarity for the ops person on call matters as much as correctness for the engineer who built the system.

## One Sentence Summary

BetterLog is an OTel-native workflow diagnosis platform that uses an explicit SDK contract and an LLM agent to translate distributed trace failures into visual, plain-language root cause analyses accessible to both engineers and non-technical ops teams.


## Future Vision (Undesigned — Long-Term Direction)

**Code-aware remediation layer:** At some point, BetterLog may store code chunks associated with each workflow step. When a step fails, the agent could surface the exact code responsible and — in some cases — propose or apply a fix in-context. This would shift the product from diagnosis (what failed and why) to automated remediation (here is the fix, do you want to apply it). The mechanism is undecided and intentionally not designed yet. It is noted here because it defines the long-term product ceiling: observability → diagnosis → remediation.
