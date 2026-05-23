# BetterLog

Workflow observability and AI diagnosis for cross-system business processes. When an order, invoice, or other multi-service workflow fails, BetterLog answers "what happened to X?" in seconds instead of the hours it currently takes to read logs across services.

## Status

Pre-MVP. Planning phase. No code yet.

## Where to start

- **[`SPEC.md`](SPEC.md)** — the source of truth for what we're building, why, and the 6-week MVP scope.
- **[`docs/`](docs/)** — deeper technical documents (mostly stubs at this stage, filled in as the MVP takes shape).

## Design partner

[Wilco](https://farmstore-modern.us) (farmstore-modern). Their order fulfillment pipeline — which traverses Nuxt, NestJS middleware, Medusa, RabbitMQ, multiple OmniAPI services, an in-house OMS/ERP (back40), and Epicor — is the MVP's primary test bed.

## What this is not

- Not another general-purpose APM tool. Datadog, Sentry, and Grafana already do that well.
- Not a workflow orchestration engine. Temporal, Inngest, and Restate already do that well.
- Not a no-code workflow builder. Zapier and n8n already do that well.

BetterLog sits between observability tools and business outcomes: it understands workflows as first-class objects, observes them end-to-end across services, and answers natural-language diagnostic questions about them.
