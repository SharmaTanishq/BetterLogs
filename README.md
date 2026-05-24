# BetterLog

Workflow observability and AI diagnosis for cross-system business processes. When an order, invoice, or other multi-service workflow fails, BetterLog answers "what happened to X?" in seconds instead of the hours it currently takes to read logs across services.

## Status

MVP build, Week 1. Scaffolding in place; OTLP ingestion is the next implementation milestone.

## Where to start

- **[`SPEC.md`](SPEC.md)** — the source of truth for what we're building, why, and the 6-week MVP scope.
- **[`docs/build-plan.md`](docs/build-plan.md)** — the implementation playbook (tech stack, hosting, repo layout, week-by-week sequence).
- **[`docs/week-0-investigation.md`](docs/week-0-investigation.md)** — Week 0 questions still open (live doc — fill in answers as they're found).
- **[`docs/`](docs/)** — deeper technical docs per component.

## Repo layout

```
apps/api               Fastify service: ingestion + diagnose + resolve + stats
packages/sdk-node      @betterlog/sdk-node — withWorkflow + recordStep
packages/shared        Types + OTel attribute constants used by API + SDK
examples/wilco-order-demo  Smoke-test app exercising the SDK end-to-end
infra/                 docker-compose (local Postgres + pgvector), migrations
docs/                  build plan + per-component design docs
```

## Local dev loop

Prereqs: Node 22+ (`.nvmrc` pins 22), pnpm 10, Docker.

```bash
pnpm install               # workspace install

cp .env.example .env       # copy local defaults
pnpm db:up                 # docker compose: postgres + pgvector on :5432
pnpm db:generate           # generate the first Drizzle migration (once)
pnpm db:migrate            # apply migrations + enable the vector extension

pnpm --filter @betterlog/api dev                          # API on :4000
pnpm --filter @betterlog/example-wilco-order-demo start   # exercises the SDK
```

Health check: `curl http://localhost:4000/health`.

## Design partner

[Wilco](https://farmstore-modern.us) (farmstore-modern). Their order fulfillment pipeline — which traverses Nuxt, NestJS middleware, Medusa, RabbitMQ, multiple OmniAPI services, an in-house OMS/ERP (back40), and Epicor — is the MVP's primary test bed.

## What this is not

- Not another general-purpose APM tool. Datadog, Sentry, and Grafana already do that well.
- Not a workflow orchestration engine. Temporal, Inngest, and Restate already do that well.
- Not a no-code workflow builder. Zapier and n8n already do that well.

BetterLog sits between observability tools and business outcomes: it understands workflows as first-class objects, observes them end-to-end across services, and answers natural-language diagnostic questions about them.
