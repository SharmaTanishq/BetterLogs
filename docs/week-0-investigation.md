# Week 0 — Investigation

**Status:** Open. Live document used to resolve the 10 open questions in `SPEC.md` §8 before Week 1 begins.
**Owner:** Tanishq (solo).
**Context:** BetterLog is built solo, in personal capacity. Wilco is the day-job client whose stack is the validation test bed — not a design partner with co-development meetings. Most of the "open questions" are answerable by reading Wilco's codebase / ops that Tanishq already has access to as their dev. A small subset needs a casual DM with a Wilco coworker (CLI distribution preferences, incident corpus access).
**Companion docs:** [`SPEC.md`](../SPEC.md) §8 (the questions), [`build-plan.md`](./build-plan.md) §7 Week 0 (the exit criteria).

Each question below has:

- **What blocks if unanswered** — which week of the build stalls.
- **How to find out** — grep targets, file paths to read, infra dashboards to check, or "this needs a 5-min DM with X."
- **Pre-investigation guesses** — best guess so we know when we've found something surprising.
- **Answer** — slot to fill in once known.
- **Decision / follow-up** — where the answer gets propagated.

---

## Personal-account provisioning (do this independently — none of it requires Wilco)

- [ ] **GitHub repo** `betterlog` created (private, personal account).
- [ ] **Neon account + project** `betterlog-mvp` provisioned. Region: pick to match Wilco's primary region (Q5 confirms; placeholder `us-east-1`).
- [ ] **Neon: `pgvector`** enabled on `main` branch (`CREATE EXTENSION IF NOT EXISTS vector;`).
- [ ] **Neon: `DATABASE_URL`** (pooled + unpooled) noted into a local `apps/api/.env` template (gitignored).
- [ ] **Fly.io account** created. `flyctl` installed. App name reserved: `betterlog-api`.
- [ ] **Anthropic API key** — personal key on personal billing. Spend cap $100/mo.
- [ ] **OpenAI API key** — personal key, for `text-embedding-3-small`. Spend cap $25/mo.
- [ ] **npm scope `@betterlog`** reserved on npmjs.com (publish nothing yet).

All independent. Knock these out in an evening; they don't block anything Wilco-related.

---

## Wilco-the-org sanity check (do this first)

Before going deep into Wilco's codebase to instrument it for a personal side project, sanity-check the org boundary. This is the one thing that genuinely needs a conversation, and it should happen before any of the investigation below.

- [ ] **Is the eng leadership at Wilco aware** that you want to install BetterLog (your personal project) into their stack to validate the idea?
- [ ] **Is there any IP / contractual concern** — does your work agreement give Wilco any claim on tools you build during the engagement? (Worth knowing before you put commits in a `betterlog` repo on your personal GitHub.)
- [ ] **Is staging / dev access enough** to validate, or do you need prod access too? (Staging is enough for Weeks 1–3; the `≥3 engineers using it 5x/week` success criterion implies prod or near-prod by Week 4.)

If any of these aren't already settled, settle them before Week 1. Easier conversation in the abstract now than after you've sunk effort.

**Status:** _to fill in_

---

## The 10 open questions

Ordered by what blocks earliest in the build.

---

### Q1. Business keys — canonical order identifier

**`SPEC.md` §8 question:** what's the canonical order identifier across Wilco's systems? Medusa order ID? back40 order ID? Both? How are they correlated?

**What blocks if unanswered:** Week 1 SDK + DB schema. The `business_keys` field and its GIN index are designed around whatever the primary lookup key is.

**How to find out:** Codebase investigation, no conversation needed.

- Read `ecom-middleware`'s order-creation flow — what ID does it generate or pick up?
- Trace through `omniapi-services` → `back40` push — what ID gets sent, and what does back40 return?
- Look at support-ticket templates / past tickets — which ID does support actually paste?
- Check Medusa's order model for the schema.

**Pre-investigation guess:** two keys — `medusa_order_id` (always present from creation) and `back40_order_id` (present after `back40.push` succeeds). Support quotes back40's. Confirm by reading.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Update `SPEC.md` §3 example `business_keys` and remove the `[ASSUMPTION]` tags downstream in §4 that depend on this.
- Record the canonical key names in `docs/data-model.md`.

---

### Q3. Service language coverage

**`SPEC.md` §8 question:** confirmed: ecom-middleware (NestJS), omniapi-* (NestJS), all Node. Is anything Python? Anything else?

**What blocks if unanswered:** Confirms the "Python SDK deferred" decision in `build-plan.md` §2.

**How to find out:** Codebase sweep.

- `find` for `package.json` and `requirements.txt` / `pyproject.toml` across the repos on the order path.
- Check Dockerfiles for base images (`node:` vs `python:` etc).
- This is 10 minutes of work; mostly confirming what you already know.

**Pre-investigation guess:** All Node on the order path. SPEC.md §8 already says "confirmed."

**Answer:**
> _to fill in_

**Decision / follow-up:**
- If anything non-Node on the order path: either accept the trace gap (document in `docs/architecture.md`) or scope a minimal Python SDK (~1 week of buffer).
- If confirmed all-Node: lock Python SDK as deferred in `docs/sdk-design.md`.

---

### Q9. CLI distribution + auth model

**`SPEC.md` §8 question:** internal npm registry, GitHub Packages, or tarball + install script? Where does the API key live? Single shared key vs. per-engineer keys?

**What blocks if unanswered:** Week 4 publish step + the auth schema in Week 1.

**How to find out:** Partly self-decision, partly a 5-min DM.

- **Self-decision:** publish on public npm under `@betterlog/cli`. The CLI is a thin HTTP client; nothing in the binary is secret. Public npm = zero install friction for Wilco engineers and anyone else who tries the tool later.
- **DM to Wilco eng leadership (informal, ~5 min):**
  - "Hey, I want to install a small CLI tool I built on a few engineers' laptops, pointing at a service I'm running, to read incident traces for our order flow. Any concern with that, or want anything specific about how it's distributed?"
- **Per-engineer keys** is a self-decision: do it. The audit value matters (one of the success criteria in `SPEC.md` §7 is "≥2 distinct engineers" — need to count distinct users). Implementation cost is trivial (an admin script, `betterlog-admin issue-key <name>`).

**Pre-investigation guess:** Public npm + per-engineer keys + `~/.betterlog/config.json` for key storage. Confirm via DM.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Lock distribution + auth in `build-plan.md` §2 rows "Auth (CLI → API)" and §7 Week 4.
- Add `betterlog-admin issue-key <name>` to Week 1 scope.

---

### Q2. RabbitMQ trace context propagation

**`SPEC.md` §8 question:** what message broker library is `omniapi-tasks` using? Does it already inject trace context?

**What blocks if unanswered:** Week 3. Per `build-plan.md` §10 risk #1, this is the most likely slip. Knowing the library early lets you prototype in Week 1.

**How to find out:** Codebase, no conversation.

- `cat omniapi-tasks/package.json` and look at the AMQP dependency.
- Likely candidates (NestJS shop):
  - `@golevelup/nestjs-rabbitmq` — most common, wraps `amqplib`.
  - `@nestjs/microservices` RMQ transport — first-party but limited.
  - `amqp-connection-manager` — wrapper around `amqplib`.
  - Raw `amqplib` — uncommon in NestJS, possible.
- Both `@golevelup/...` and `amqp-connection-manager` sit on `amqplib`, so `@opentelemetry/instrumentation-amqplib` auto-injection should work. `@nestjs/microservices` is the awkward case — manual header injection.
- Also grep for any existing `traceparent`, `correlation_id`, or OTel imports — if Wilco already has trace propagation, half the work is done.
- Check whether `omniapi-tasks` is the only queue boundary on the order path, or if there are others (retry queue, dead-letter routing).

**Pre-investigation guess:** `@golevelup/nestjs-rabbitmq`, no existing OTel propagation. OTel auto-instrumentation will work.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Record the library + recipe in `docs/rabbitmq-tracing.md`.
- Week 1 mitigation: write a throwaway producer+consumer prototype using the actual library, verify `traceparent` round-trips. De-risks Week 3.

---

### Q4. back40 instrumentability

**`SPEC.md` §8 question:** is back40 a system we can add SDK calls to, or is it third-party / closed?

**What blocks if unanswered:** Week 3 — affects whether we instrument inside back40 or only the BetterLog-side of the boundary.

**How to find out:** Likely you already know (you work with this system).

- Confirm: back40 is described as OMS/ERP. Vendor product or in-house?
- Either way, the pragmatic play is "instrument the boundary, not the internals" — `omniapi-services` records the request payload + the back40 response.
- Same applies for Epicor (final system of record).

**Pre-investigation guess:** Third-party / closed. We instrument the boundary only.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Document the boundary-instrumentation strategy in `docs/architecture.md` + `docs/sdk-design.md`.
- Adjust eval-suite Q3 ("stuck between Medusa and back40") rubric in `docs/evaluation.md`.

---

### Q5. Existing observability stack at Wilco

**`SPEC.md` §8 question:** does Wilco run Datadog/Sentry/OTel today? If yes, can we read from their existing collector?

**What blocks if unanswered:** Week 1–3 ingestion topology, and Neon region choice.

**How to find out:** Infra investigation, no conversation.

- Check `package.json` files for `@opentelemetry/*`, `dd-trace`, `@sentry/*` deps.
- Check terraform / k8s manifests / helm charts for `otel-collector`, `datadog-agent`, `sentry`.
- Check `.env` / config repos for `OTEL_*`, `DD_*`, `SENTRY_*` env vars.
- Find out the cloud region Wilco services run in (terraform vars, AWS console, etc.) — needed for Neon region selection.

**Pre-investigation guess:**
- Datadog or Sentry probably present in some form.
- OTel Collector probably not deployed (less common in NestJS shops).
- If OTel is present: configure it with a second exporter pointing at `betterlog-api`. Cleaner than adding a duplicate export path.
- If OTel is absent: SDK exports directly to `betterlog-api`.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Document the ingestion path in `docs/architecture.md`.
- Lock Neon region.

---

### Q6. Payload sensitivity / PII allow-list

**`SPEC.md` §8 question:** what PII lives in order payloads? Allow-list strategy before capturing step input/output to storage.

**What blocks if unanswered:** Week 1 SDK design + Week 3 instrumentation. Customer PII must not leak into the personal BetterLog DB (this is also where Wilco-the-org needs to be comfortable — see "sanity check" section above).

**How to find out:** Codebase + a sanity-check chat with Wilco eng leadership (folded into the sanity-check conversation at the top of this doc).

- Read the order payload schema in Medusa and `ecom-middleware`. Identify each field's category:
  - **Safe to store:** SKUs, quantities, line-item counts, totals, currency, status fields, error codes, internal IDs.
  - **Must redact:** customer email, name, addresses, payment tokens, anything PCI/PII.
- Confirm with Wilco eng leadership that storing the safe set in your personal-cloud DB is acceptable.
- SDK design: `recordStep("back40.push", "started", { input: pick(payload, ["order_id", "line_items.sku", "total_cents"]) })` — provide an `allowFields` / `pick` helper, make redaction the obvious path. Don't silently auto-redact (too magical, hides bugs).

**Pre-investigation guess:** Standard e-com PII set. Allow-list approach is fine.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Define the allow-list helper API in `docs/sdk-design.md`.
- Document the default allow-list for `order.fulfillment` in `examples/wilco-order-demo/`.
- Retention policy implications in `docs/data-model.md`.

---

### Q7. Deploy event source

**`SPEC.md` §8 question:** to answer eval-Q7 (deploy correlation), we need deploy events. CI? GitHub Actions? K8s events?

**What blocks if unanswered:** Eval-suite Q7 specifically. Missing this degrades 1 of 10 eval questions but doesn't break the MVP.

**How to find out:** Codebase, no conversation.

- Check `.github/workflows/` (or GitLab CI / Argo / Jenkins / whatever Wilco uses).
- Identify the deploy job for the order-path services.
- Easiest integration: add a `curl POST` step at the end of the deploy job to a `POST /v1/events/deploy` endpoint on `betterlog-api`. ~10 lines of YAML per service.

**Pre-investigation guess:** GitHub Actions. `curl POST` integration is trivial.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- If achievable: add `POST /v1/events/deploy` to Week 2 scope.
- If not: explicitly defer eval-Q7 with a "data not available" caveat in `docs/evaluation.md`.

---

### Q8. Historical incidents corpus

**`SPEC.md` §8 question:** do we have access to ~20 real incidents (Slack threads, postmortems, support tickets) for the eval harness?

**What blocks if unanswered:** **Week 5 completely.** Highest-stakes question. No corpus → no eval → no defensible accuracy claim → the falsification criterion in `SPEC.md` §1 can't be evaluated.

**How to find out:** Partly self-scrape, partly a real conversation.

- **Self-scrape (the easy part):** Slack history for `#incidents`, `#ops`, `#eng`, `#support` — search "order failed", "back40", "integrator", "stuck". Past 6 months. Save thread URLs.
- **Confluence / Notion / wiki:** any "postmortems" or "incident reports" folder.
- **Sentry / Datadog:** past alerts on the order-path services — bulk technical signal that can seed synthetic incidents.
- **Conversation (the harder part):** find one Wilco coworker who remembers the failure modes and is willing to spend 1–2 hours annotating root causes and remediations onto the threads you collected. Schedule it in **Week 1**, not Week 5. Without a named human, this slips.
- **Fallback:** if real corpus is thin, synthesize incidents based on documented failure modes. Worse than real (biases eval toward your priors), but acceptable as a supplement. Per `build-plan.md` §10 risk #2.

**Pre-investigation guess:** 6–12 real incidents are findable in Slack; need a coworker to help disambiguate root causes for half of them. Likely supplemented with ~8 synthetic to reach 20.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Real-incident count + named annotator → schedule Week 1 annotation session.
- Synthetic incident count + generation strategy → `docs/evaluation.md`.
- If corpus is fundamentally thin (<10 real or near-real): flag against `SPEC.md` §7 success criteria as a known limitation.

---

### Q10. Definition of "stuck"

**`SPEC.md` §8 question:** Q3 of the eval suite mentions a 5-minute threshold. What's the real SLA for an order to reach back40?

**What blocks if unanswered:** Eval-suite Q3 + the `betterlog stuck` CLI command in Week 4.

**How to find out:** Either empirical or a 2-min DM.

- **Empirical:** query Wilco's prod DB (or whatever holds order timestamps) for the distribution of "order created" → "back40 confirmed" latency over the last 30 days. Read off p50, p95, p99.
- **DM to a Wilco SRE or order-flow owner:** "What's the latency above which you'd start investigating an order?" Equivalent answer in 2 minutes.
- We actually want **two thresholds**:
  - "Probably stuck" (yellow) — `betterlog stuck` surfaces it. Default ~5 min from start with no `back40.push`.
  - "Definitely stuck" (red) — fires the outgoing webhook. Default ~15 min.
- Either way, make these per-workspace config, not hardcoded.

**Pre-investigation guess:** p99 end-to-end is well under 1 minute. "Yellow" = 5 min, "red" = 15 min are reasonable defaults.

**Answer:**
> _to fill in_

**Decision / follow-up:**
- Record both thresholds in `docs/diagnosis-loop.md`.
- Per-workspace config for the threshold values — Week 4 scope.

---

## Week 0 exit checklist

Gating list before Week 1 begins. Maps to `build-plan.md` §7 Week 0 exit criteria.

**Wilco-the-org sanity check passed:**

- [ ] Eng leadership aware of BetterLog as a personal-project install on Wilco's stack.
- [ ] No IP / contractual blocker on the personal-GitHub repo + personal cloud accounts.

**All 10 spec open questions answered or explicitly deferred:**

- [ ] Q1 — Business keys identified.
- [ ] Q2 — RabbitMQ library identified.
- [ ] Q3 — Language coverage confirmed.
- [ ] Q4 — back40 boundary strategy locked.
- [ ] Q5 — Existing observability stack mapped + Neon region locked.
- [ ] Q6 — PII allow-list policy agreed with self + Wilco eng leadership.
- [ ] Q7 — Deploy event source identified (or eval-Q7 explicitly deferred).
- [ ] Q8 — Real incident count known + annotator identified + Week 1 annotation session scheduled.
- [ ] Q9 — CLI distribution + auth-key model decided.
- [ ] Q10 — Stuck thresholds captured.

**Personal infra provisioned (covered in the top section):**

- [ ] DB hosting decided (✅ done 2026-05-23 — Neon, see [`build-plan.md` §6](./build-plan.md#6-database-hosting-decision)).
- [ ] GitHub repo, Neon project, Fly account, Anthropic key, OpenAI key, npm scope all provisioned.

When every box is ticked, Week 1 begins.
