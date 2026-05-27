# Business Context

## Product or Service

BetterLog is a case-level workflow diagnosis tool built on OpenTelemetry. Engineers declare workflow shape explicitly via an SDK contract; the platform stitches spans into named, ordered workflows keyed to business identifiers (`order_id`, `invoice_id`, `run_id`, etc.) so both engineers and non-technical ops teams can answer *"what happened to X?"* — for one specific order, invoice, or run — without reading raw traces.

**The moat is the workflow contract, not the AI.** Step sequence is declared at instrumentation time, not inferred from span timestamps or parentage. That makes diagnosis deterministic and the timeline trustworthy for non-engineers. The LLM is how the answer gets phrased; it is not what makes the product defensible. "AI for observability" is becoming commoditized as every incumbent (Datadog Bits, Honeycomb Canvas, New Relic SRE Agent) bolts on similar features. The explicit contract + case-level framing is the durable differentiator.

**SDK Design:**
- Engineers annotate their code with `@workflow(name, service)` and `recordStep()` calls. This creates an explicit, ordered workflow contract — step sequence is declared at instrumentation time, not inferred.
- This thin semantic layer emits standard OTel spans underneath, so it plugs into existing collectors (Jaeger, Tempo, Datadog, etc.) without replacing them.
- The explicit contract makes diagnosis deterministic and makes the visual graph trustworthy for non-engineers. Ops see step names they recognize, not internal span IDs.
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

**Key differentiator from Datadog/Honeycomb/Dynatrace:** Those tools surface raw traces and infrastructure dependency graphs for engineers. They infer workflow shape from span timestamps and parentage — which works for system-level debugging but breaks for case-level questions ("what happened to *this* order?"). BetterLog's explicit `@workflow` + `recordStep()` contract locks the step sequence at instrumentation time, so the diagnosis output is in language ops teams already use ("step 3 of order fulfillment failed because the SKU mapping was missing"), not span IDs and latency percentiles. Different user, different job to be done.

**Explicitly NOT positioned as:**
- *"Another observability platform."* Datadog, Honeycomb, New Relic, and Grafana own that category. BetterLog is a thin diagnosis layer that runs *on top of* whatever observability backend the team already has.
- *"AI SRE" / "AI-powered observability."* Increasingly crowded category, increasingly commoditized capability. The defensible position is the workflow contract and the case-level framing — not the LLM doing the talking.

## ICP

**Two-layer ICP — explicit buyer/user split.** The buyer (champion) and the daily user are different people with different reasons to want the product. This split is intentional and load-bearing for positioning:

- **Engineers install it because it reduces interruptions.** Every "what happened to order #1234?" Slack message from ops is a context switch that costs an engineer 30+ minutes. BetterLog removes that interrupt loop.
- **Ops use it because it gives them an answer.** Today they Slack engineering and wait. With BetterLog they get a named, case-level timeline they can read without trace literacy.

**Buyer / internal champion:** Platform or infrastructure engineer at a mid-size SaaS (50–500 engineers).
- Owns the OTel pipeline; adoption requires adding `@workflow` + `recordStep()` annotations — low effort, not a full re-instrumentation.
- Gets paged on workflow failures; wants faster RCA for themselves first.
- Champions BetterLog internally because it reduces ops-to-engineering escalations.

**Primary daily user (post-web-app):** Operations team member at an e-commerce, logistics, fintech, or B2B SaaS company.
- Does not read traces or logs.
- Needs to know: what failed, why, what to do, whether it has happened before.
- Currently waits on engineers to interpret failures — BetterLog removes that bottleneck.

**Adoption-shape constraint (must hold for bottom-up SDK distribution to work):** A single team must be able to instrument a single workflow they already own and get value the same day. Workflows whose steps cross multiple unrelated teams require org-wide coordination, which kills bottom-up adoption and forces a top-down sales motion. ICP filtering follows from this: target teams that own a complete case-level workflow end-to-end, not workflows split across team boundaries.

**Entry segment:** Mid-size SaaS teams running case-keyed workflows where one engineering org owns the full pipeline. Concrete examples: e-commerce order fulfillment, invoice / billing sync, ETL and scheduled-job pipelines, webhook handler chains, agent tool-call traces. Failures are frequent, business-impactful, and pattern-repeating.

## Mission

To give every team — engineers and ops alike — immediate, actionable clarity on why a cross-service workflow failed, without requiring anyone to become a distributed tracing expert.

## Go-To-Market Strategy

**Wedge — concrete vs. positioned:** Two layers, intentionally separated.

- The *concrete test wedge* is e-commerce order fulfillment, validated against an existing pilot client. High failure rate, clear business impact, repeatable demo. This is where the thesis gets proven and the first design-partner case study comes from.
- The *positioned category* is generic — "case-level workflow diagnosis for cross-service business workflows." The website, outbound, and community materials use this framing. Order fulfillment is one demo among several; it is not the brand.

The split matters: leading with "for e-commerce orders" narrows the addressable market and signals niche tooling. Leading with the workflow contract + case-level framing lets every case-keyed workflow team (invoice sync, ETL, webhook chains, agent traces, scheduled jobs) self-identify, while the order-fulfillment demo proves the engine is real.

**Distribution:** Open-source core (SDK + CLI) drives bottom-up adoption among engineers. Paid hosted backend and web app converts teams that want managed infra and the ops-facing UI. This motion only holds if the adoption-shape constraint above holds — i.e., one engineer can install the SDK in their team's services and get value the same day, without org-wide coordination.

**GTM motion:**
1. Publish open-source SDK + CLI. Target OTel community (CNCF Slack, OTel SIG, Hacker News, r/devops, r/sre).
2. Sign 3–5 design partners across distinct workflow types (one e-commerce order, one invoice sync, one pipeline / agent trace) — diversity de-risks the "are we niche?" question and produces three different case studies.
3. Use design partner outcomes (MTTR reduction, ops-to-eng escalations avoided, named cases resolved without paging) as conversion evidence.
4. Web app expands from engineer tool to team-wide platform — increases seat count, raises ACV.

**Key objections and counters:**
- *"We already have Datadog."* Datadog serves engineers reading traces. BetterLog serves the ops person getting the Slack message when order-1234 fails. Sits on top of the existing OTel pipeline — not a replacement.
- *"Isn't this just AI SRE?"* No. AI SRE is "an LLM looks at metrics and tells SRE what's broken." BetterLog is "engineers explicitly mark workflow steps; ops get a named, case-level timeline." Different mechanism, different user, different category.
- *"Won't the LLM cost get out of control?"* BYOK (customer's own OpenAI / Anthropic / Ollama key); plus failure summaries stored as embeddings in pgvector for similarity search, so we don't re-run the LLM for repeat patterns.

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

BetterLog is an OTel-native, case-level workflow diagnosis platform: engineers declare workflow shape explicitly via an SDK contract, the system stitches spans into named workflows keyed to business identifiers, and both engineers and non-technical ops teams get plain-language root cause analyses for any specific order, invoice, or run — without reading raw traces.


## Future Vision (Undesigned — Long-Term Direction)

**Code-aware remediation layer:** At some point, BetterLog may store code chunks associated with each workflow step. When a step fails, the agent could surface the exact code responsible and — in some cases — propose or apply a fix in-context. This would shift the product from diagnosis (what failed and why) to automated remediation (here is the fix, do you want to apply it). The mechanism is undecided and intentionally not designed yet. It is noted here because it defines the long-term product ceiling: observability → diagnosis → remediation.
