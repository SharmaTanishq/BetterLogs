# Build Plan

**Status:** Agreed plan as of 2026-05-23. Consolidates decisions made during pre-MVP planning.
**Sources:** [`SPEC.md`](../SPEC.md) is the source of truth for *what* we are building. This document is *how* we are going to build it — tech stack, hosting, repo layout, week-by-week sequence.
**Owner:** Tanishq
**Target build window:** 6 weeks from kickoff.

If anything here conflicts with `SPEC.md`, the spec wins and this doc should be updated.

---

## 1. How to use this doc

This is the implementation playbook. It does not duplicate the spec — for product behavior, the 10 example questions, the data model, success criteria, and open questions, read `SPEC.md`. For per-component deep dives (SDK ergonomics, agent design, RabbitMQ propagation, eval harness, data model details), see the stubs in this same `docs/` folder, which get filled in as each component is built.

The cross-cutting decisions that aren't in those other places live here.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Language** | TypeScript everywhere (Node 22 LTS) | Wilco's stack is Node/NestJS. SDK is Node. One language across SDK, API, and CLI keeps the surface area tiny. Python SDK is **deferred** out of MVP per spec §6 — add when a customer needs it. |
| **API framework** | Fastify | Faster + simpler than Express, first-class TS, plays nicely with Zod. Boring is correct for MVP. |
| **Validation** | Zod + `@fastify/type-provider-zod` | One schema definition flows into route validation, OpenAPI generation (later), and shared types. |
| **ORM** | Drizzle | Type-safe, close to SQL when you need it, has a `pgvector` helper. Drizzle migrations (`drizzle-kit`) generate SQL from the TS schema; checked into `infra/migrations/`. |
| **Database** | Postgres 16 + `pgvector` extension | Already committed in `SPEC.md` §3. HNSW index on the embeddings table per the spec DDL. |
| **Database hosting** | **Neon** (decided 2026-05-23, see §6). | Built-in pgvector, DB branching for eval harness, $0 at MVP scale. |
| **App hosting** | Fly.io | Stateful-friendly, single config file (`fly.toml`). Paired with Neon, not Railway-bundled, because branching beats one-dashboard convenience for the Week 5 eval crunch. |
| **Agent / LLM client** | Vercel AI SDK (`ai` package) | Clean abstraction over OpenAI / Anthropic / Ollama / etc. (matches BYOK requirement in `SPEC.md` §5). Built-in tool-calling primitive. Avoid LangChain — too much abstraction and breakage for a single-agent loop. |
| **LLM provider** | **BYOK, runtime-selectable.** No "primary" provider. Configured via `BETTERLOG_LLM_PROVIDER` + `BETTERLOG_LLM_MODEL` env vars; the diagnose endpoint reads them at request time. Supported out-of-box: OpenAI, Anthropic, Ollama. | Per `SPEC.md` §5. Adding another provider is a one-line addition in `createModel(...)`. Dev default while iterating: whichever provider's API key is present in `.env`. |
| **Embedding model** | `text-embedding-3-small` (OpenAI), 1536 dims, for MVP | Matches `VECTOR(1536)` in the spec DDL. Cheap; good enough for failure-signature similarity. Single embedding provider for MVP because vector dimensions are baked into the schema — making this BYOK requires either schema-per-provider or a `provider` tag column on `failure_embeddings`. Deferred until a real customer needs it. |
| **CLI** | Node, `commander` + `kleur` + `ora` | Distributed as `@betterlog/cli` via npm or tarball. Thin HTTP client over the API. |
| **OTel ingestion** | The API service itself exposes an OTLP/HTTP receiver endpoint. **No separate OTel Collector for MVP.** | One fewer moving part. Customers who already run a Collector can point theirs at our endpoint later — the wire format is the same. |
| **Outgoing webhook (alerts)** | Single configurable URL per workspace; the API POSTs a structured payload on workflow failure. Customer wires it to Slack incoming webhook / Discord / PagerDuty as they like. | Replaces the need for a Slack app at MVP per `SPEC.md` §5 + §6. |
| **Repo** | Single monorepo, pnpm workspaces + Turborepo | Avoids polyrepo coordination tax for a 6-week build. |
| **Testing** | Vitest | Same runner for unit tests and the eval harness. |
| **CI/CD** | GitHub Actions | Lint + typecheck + unit tests on every PR; eval harness runs nightly against the frozen incident corpus. |
| **Secrets** | Fly/Railway secrets in prod, `.env` (gitignored) locally | No Vault/Doppler at this stage. |
| **Auth (SDK → API)** | Single API key per workspace, sent as `Authorization: Bearer <key>` header | One key for Wilco for MVP. No rotation UI, no per-user auth. |
| **Auth (CLI → API)** | API key from `BETTERLOG_API_KEY` env var or `~/.betterlog/config.json` | Per-engineer key recommended for audit, single shared key acceptable for MVP. Decision deferred to Open Question §8.9 in spec. |
| **Logging** | `pino` + structured JSON | Plays well with Fly/Railway log shipping. |

---

## 3. Architecture

Concrete architecture for MVP. This is the implementation of the diagram in `SPEC.md` §5.

```
Wilco services (Node + @betterlog/sdk-node)
        │
        │  OTLP/HTTP (spans with betterlog.* attributes + API key in header)
        ▼
┌──────────────────────────────────────────┐
│  betterlog-api  (Fastify on Fly/Railway) │
│  ├─ POST /v1/otlp/traces                  │  ingestion receiver
│  ├─ POST /v1/diagnose                     │  diagnosis agent loop
│  ├─ POST /v1/resolve                      │  remediation capture
│  ├─ GET  /v1/stats                        │  pipeline stats for CLI
│  ├─ GET  /v1/stuck                        │  in-flight stuck workflows
│  └─ background: on outcome=failed,        │
│       embed summary + POST webhook        │
└──────────────┬───────────────────────────┘
               │
               ▼
        Postgres 16 + pgvector (Neon / Railway / etc.)
               ▲
               │ HTTP
        @betterlog/cli  (engineer's laptop)
        commands: diagnose, health, stuck, similar,
                  stats, watch, resolve, config

        (failure events ─optionally─▶ outgoing webhook URL → Slack / Discord / PagerDuty / etc.)
```

Three runtime things to deploy:
1. **`betterlog-api`** — single Fastify service hosting ingestion + diagnose + resolve + stats endpoints.
2. **Postgres** — managed (Neon or Railway-managed instance).
3. **Wilco services with SDK installed** — already running, just add the npm dependency.

That's it. No Kafka, no Redis, no separate Collector, no worker pool. If ingestion throughput becomes a problem we add a queue, but at Wilco's order volume (likely <10 orders/min peak) Fastify direct-to-Postgres is fine.

---

## 4. Repo structure

```
betterlog/
├── apps/
│   └── api/                  # Fastify: ingestion + diagnose + resolve + stats
│       ├── src/
│       │   ├── routes/
│       │   ├── ingestion/    # OTLP parser → DB writer
│       │   ├── diagnose/     # agent loop + 6 tools from SPEC §5
│       │   ├── resolve/      # remediation capture
│       │   ├── webhook/      # outgoing webhook on failure
│       │   └── db/           # Drizzle schema + client
│       └── fly.toml          # (or railway.json, depending on hosting choice)
├── packages/
│   ├── sdk-node/             # what customers `npm install`
│   │   ├── src/
│   │   │   ├── withWorkflow.ts
│   │   │   ├── recordStep.ts
│   │   │   └── otel.ts       # span helpers, attribute conventions
│   │   └── package.json
│   ├── cli/                  # @betterlog/cli
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── diagnose.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── stuck.ts
│   │   │   │   ├── similar.ts
│   │   │   │   ├── stats.ts
│   │   │   │   ├── watch.ts
│   │   │   │   ├── resolve.ts
│   │   │   │   └── config.ts
│   │   │   └── http.ts       # API client
│   │   └── package.json
│   └── shared/               # types shared SDK ↔ API ↔ CLI
├── evals/
│   ├── corpus/               # frozen historical incidents (JSON)
│   ├── harness.ts            # replay + score
│   └── rubrics/              # per-question grading
├── infra/
│   ├── docker-compose.yml    # local Postgres + pgvector + optional Ollama
│   └── migrations/           # Drizzle SQL migrations
├── examples/
│   └── wilco-order-demo/     # tiny app exercising the SDK end-to-end
├── package.json              # pnpm workspaces root
├── turbo.json
├── SPEC.md                   # product spec (source of truth)
├── docs/                     # this folder
└── README.md
```

---

## 5. CLI command surface

Defined here for reference; the actual implementations land in `packages/cli/src/commands/`.

```bash
# Headline use case (SPEC §4 Q1)
betterlog diagnose order-1234
betterlog diagnose "why are orders failing at the integrator today?"

# Status & trend queries (SPEC §4 Q3, Q5, Q8, Q9)
betterlog stuck --workflow order.fulfillment --since 1h
betterlog health
betterlog stats --workflow order.fulfillment --since 24h
betterlog similar --workflow-id wf_01HXY...

# Live tail (replaces Slack auto-alerts for engineers)
betterlog watch
betterlog watch --workflow order.fulfillment --status failed

# Remediation capture (SPEC §4 Q10)
betterlog resolve order-1234 \
    --reason SKU_MAPPING_MISSING \
    --action "added P-9821 to mapping table"

# Configuration
betterlog config set api-url https://api.betterlog.fly.dev
betterlog config set api-key blg_xxx
```

All commands are thin HTTP clients over `betterlog-api`. No server logic lives in the CLI.

---

## 6. Database hosting decision

**Decided 2026-05-23: Neon (Postgres) + Fly.io (API).**

### Options considered

| Option | MVP cost | pgvector | DB branching | Scale-to-zero | One dashboard with API |
|---|---|---|---|---|---|
| **Neon** ✅ chosen | $0 (free tier) | Built-in, 1-line enable | Yes (excellent for eval) | Yes | No (API on Fly separately) |
| Railway (managed Postgres + API) | ~$5–15/mo | Needs `pgvector/pgvector:pg16` Docker image | No | No | **Yes** |
| Render | ~$0–7/mo | Built-in | No | No (DB) | **Yes** |
| Supabase | $0 (free tier, pauses after 1wk idle) | Built-in | Limited | No | **Yes** (also gives auth/realtime if ever needed) |

### Why Neon

The tiebreaker is **Week 5**. Per §7, week 5 is the highest-risk week — the eval-accuracy crunch — and the one most likely to need extra time. The work in that week is rapid iteration on prompts, tool implementations, and tool descriptions against a frozen incident corpus. Two capabilities matter disproportionately during that week:

1. **DB branching** — fork the prod DB into a throwaway branch per prompt-tuning experiment without rebuilding seed data. Only Neon offers this. None of Railway / Render / Supabase do.
2. **Scale-to-zero** — the DB sits idle between dogfooding sessions and during off-hours; not paying for idle compute keeps MVP cost firmly in "negligible" territory.

### Why not the others

- **Railway** — the strongest alternative. Its one-dashboard advantage is real, and bundling DB+API in one bill is genuinely nicer to operate. But losing branching during the Week 5 eval crunch is a worse trade than managing one extra dashboard for six weeks. Also requires the `pgvector/pgvector:pg16` Docker image rather than the default Postgres template, which adds a small operational gotcha.
- **Render** — no advantage over Neon for our shape. Slightly worse free tier, no branching, no scale-to-zero on the DB.
- **Supabase** — the auto-pause-after-1-week-idle behavior on the free tier is a real footgun for a 6-week project that may have multi-day quiet stretches between Wilco dogfooding sessions. The auth/realtime extras are features we explicitly don't want (per `SPEC.md` §6, no auth, no realtime).

### Trade-off we accept

Two dashboards instead of one (Neon for DB, Fly for API). Acceptable for a 6-week, single-customer build.

### Follow-ups (Week 0 provisioning)

- [ ] Create Neon project `betterlog-mvp`, region: closest to Wilco's primary services (likely `us-east-1` or `eu-central-1` — confirm in kickoff).
- [ ] Enable `pgvector` extension on the default branch.
- [ ] Note `DATABASE_URL` — pooled and unpooled — for `apps/api/.env` (gitignored) and Fly secrets.
- [ ] Decide branch naming convention before Week 5: `main` (prod), `eval-<date>` per eval run, `dev-<name>` for in-progress experiments.

---

## 7. The 6-week build sequence

Each week has a single concrete exit criterion. If a week slips, cut scope from the *next* week, not from the success criteria in `SPEC.md` §7.

### Week 0 — Investigation (resolve the unknowns)
- Resolve the 10 open questions in `SPEC.md` §8 by investigating the Wilco stack you already have access to as their dev. Use [`docs/week-0-investigation.md`](./week-0-investigation.md) as the playbook — it tells you, per question, where to grep / which file to read / which coworker to DM (the small subset of questions that need a conversation), and has slots to record answers.
- Highest-stakes questions: business keys, RabbitMQ library, deploy event source, historical incidents corpus, CLI distribution.
- Sanity-check with Wilco eng leadership that installing a personal-project tool into their stack is fine before sinking effort into instrumentation (see `docs/week-0-investigation.md` "Wilco-the-org sanity check").
- DB hosting **already decided** (§6 above — Neon + Fly).
- Provision personal accounts: GitHub repo, Neon account + project, Fly.io account, Anthropic API key, OpenAI API key, npm scope (`@betterlog`).
- **Exit:** All 10 spec open questions answered or explicitly deferred (recorded in `docs/week-0-investigation.md`). Personal infra provisioned. Wilco-the-org sanity-check passed.

### Week 1 — Foundation
- Monorepo scaffolding (pnpm workspaces, Turborepo, TS, ESLint, Vitest).
- Docker compose with Postgres + pgvector for local dev.
- Drizzle schema from `SPEC.md` §3 + first migration applied to dev DB.
- `betterlog-api` skeleton: health route + OTLP receiver route that writes spans to DB.
- `sdk-node` skeleton: `withWorkflow(name, businessKeys, fn)` and `recordStep(name, status, data?)` emitting OTel spans with the `betterlog.*` attributes from `SPEC.md` §3.
- Tiny demo app under `examples/wilco-order-demo/` that exercises the SDK end-to-end.
- **Exit:** Running the demo app produces a `workflows` row + `steps` rows in Postgres via the OTLP path.

### Week 2 — Diagnosis engine v0
- Implement the 6 tools from `SPEC.md` §5 as plain TS functions over Drizzle.
- Build the single-agent loop using Vercel AI SDK (`generateText` with `tools` and `maxSteps: 8`).
- `POST /v1/diagnose` endpoint accepting `{ question: string, workflow_id?: string }`.
- System prompt + tool descriptions, tuned by hand against seed data.
- Failure-embedding writer (runs as background job on workflow outcome = failed/timeout).
- Minimal `betterlog diagnose` CLI command (just enough to invoke the endpoint and print the answer).
- **Exit:** With seeded synthetic data, can answer Q1 ("What happened to order #1234?") correctly via the API and the CLI.

### Week 3 — Wilco instrumentation
- Add the SDK to Wilco services along the `order.fulfillment` path: `ecom-middleware`, `omniapi-tasks`, `omniapi-integrator`, `omniapi-services`.
- **RabbitMQ trace context propagation** — see [`docs/rabbitmq-tracing.md`](./rabbitmq-tracing.md). This is the biggest unknown. Use `@opentelemetry/instrumentation-amqplib` if the library matches; otherwise inject `traceparent` into message headers manually.
- Validate real orders appear in BetterLog DB with full step graphs (both success and failure cases).
- **Exit:** A real Wilco order placed in staging produces a complete workflow + steps trail in BetterLog. Failed orders show up with the failing step identified.

### Week 4 — CLI + dogfooding
- Build out all CLI commands listed in §5 above.
- Add outgoing webhook (single config URL, POSTs structured payload on workflow failure) so engineers get push notifications without us building a Slack app.
- Publish CLI: internal npm registry / GitHub Packages / tarball + install script (whichever Wilco prefers, decided in week 0).
- Deploy `betterlog-api` to Fly/Railway.
- Wilco engineering team starts using the CLI in their daily flow.
- Capture every `betterlog diagnose` invocation + the user's eventual `betterlog resolve` into the eval corpus for week 5.
- **Exit:** CLI installed and used by ≥3 Wilco engineers, ≥5 invocations each.

### Week 5 — Eval harness + accuracy work
- Build the eval harness per [`docs/evaluation.md`](./evaluation.md): replay frozen incidents through `/v1/diagnose`, score against rubrics (mix of exact-match assertions + LLM-as-judge for narrative quality).
- Load the 20+ historical incidents collected in week 0 + dogfooding from week 4.
- Iterate on prompts, tool descriptions, and tool implementations until accuracy hits 80%.
- **This is the week most likely to need extra time** — budget for it to bleed into week 6 if needed.
- **Exit:** Eval suite at ≥80% on the frozen corpus. Median latency <30s.

### Week 6 — Second workflow + go/no-go
- Instrument a second Wilco workflow (refund or inventory sync) without modifying the core data model. This is the falsification test for the data model from `SPEC.md` §1.
- Fix top 5 bugs from week 4-5 usage.
- Measure all five success criteria from `SPEC.md` §7.
- Write a one-page memo: hit/miss on each criterion, what we learned, recommended next step.
- **Exit:** Memo written. Go/no-go decision made.

---

## 8. Costs at MVP scale

Negligible. Rough monthly:

- App host (Fly.io): $0–15
- Database (Neon free tier): $0–10
- LLM (whichever provider — ~50 `/diagnose` calls/day × ~$0.02 each at mid-tier models): $20–80
- Embeddings (OpenAI `text-embedding-3-small`, a few hundred per week): <$5

**Total: well under $200/month through the MVP.** LLM inference is the dominant cost regardless of provider.

---

## 9. Explicitly NOT in this plan

These are absent on purpose, in line with `SPEC.md` §6:

- No web dashboard. (Deferred — comes after the engine is trusted.)
- No Slack app, email integration, or PagerDuty integration. (Single outgoing webhook URL is the only push surface.)
- No queue/worker tier. (Direct API → DB writes are fine at this volume.)
- No multi-tenant auth. (Single API key, single workspace, hardcoded.)
- No remediation actions yet. (Per the deferred-to-v2 note in `SPEC.md` §6 — `betterlog resolve` captures metadata only, doesn't yet replay workflows.)
- No Python SDK. (Deferred until a customer needs it.)
- No CI/CD beyond GitHub Actions running tests + nightly eval harness. (No staging/canary/blue-green.)
- No standalone OTel Collector. (API exposes OTLP receiver directly.)

---

## 10. The risks worth naming

1. **RabbitMQ context propagation (week 3)** — most likely to slip. Mitigation: prototype this in week 1 with a throwaway script as soon as we know the AMQP library. See [`docs/rabbitmq-tracing.md`](./rabbitmq-tracing.md).
2. **80% diagnosis accuracy (week 5)** — depends on quality of historical corpus. Mitigation: collect aggressively from week 4 dogfooding, supplement with synthetic incidents if real corpus is thin.
3. **Wilco access** — getting SDK installed in Wilco services, deploy access, npm-package install. Mitigation: solve in week 0, not week 3.
4. **Solo dev — BetterLog vs. paid Wilco work for the same hours.** BetterLog is built in personal capacity; Wilco is the day job and will always have an SLA on Tanishq's time that BetterLog won't. Mitigation: protect a fixed weekly block (e.g., evenings + one weekend slot) for BetterLog and treat it as non-negotiable; do a Friday self-review against the relevant week's exit criterion in §7 and cut scope from the *next* week before the current one slips.

---

## 11. Related docs

- [`SPEC.md`](../SPEC.md) — the WHAT (product hypothesis, data model, example questions, success criteria).
- [`docs/week-0-investigation.md`](./week-0-investigation.md) — Week 0 solo investigation playbook: per-question grep/read targets, the small set of questions that need a coworker DM, exit checklist.
- [`docs/architecture.md`](./architecture.md) — component-by-component design (filled in during week 0–1).
- [`docs/data-model.md`](./data-model.md) — DDL details, indexes, retention (filled in during week 1).
- [`docs/sdk-design.md`](./sdk-design.md) — SDK API surface and ergonomics (filled in during week 1).
- [`docs/diagnosis-loop.md`](./diagnosis-loop.md) — agent loop design, tools, prompts (filled in during week 2–3).
- [`docs/rabbitmq-tracing.md`](./rabbitmq-tracing.md) — async context propagation playbook (filled in during week 1–2).
- [`docs/evaluation.md`](./evaluation.md) — eval harness methodology and grading rubrics (filled in during week 2 onwards).
