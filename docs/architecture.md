# Architecture

> **Status:** TODO — being filled in during MVP week 0-1.

This document will expand on the architecture summary in [`SPEC.md`](../SPEC.md) Section 5. It is the place to capture decisions that are too detailed for the spec but too important to live only in code.

## Planned contents

- Component-by-component design: SDK, OTel ingestion path, Postgres schema, diagnosis API, CLI, optional outgoing webhook.
- Deployment topology for the Wilco rollout (Kubernetes manifests, environment variables, secrets handling).
- Request flows: span ingestion, diagnosis request, outgoing-webhook alert delivery, remediation capture via CLI.
- Failure modes and degradation strategy (what happens when the LLM is slow, when ingestion is backed up, when Postgres is unavailable).
- Capacity assumptions for the MVP scale (Wilco order volume, expected spans/sec, storage growth).
- Migration / upgrade strategy for the data model as it evolves post-MVP.

## Decisions recorded

### 2026-05-23 — Database hosting: Neon

Postgres 16 with `pgvector` on Neon's free tier, paired with Fly.io for the API service. Tiebreaker over Railway was DB branching, which becomes load-bearing in Week 5 (eval-accuracy iteration). Full rationale: [`build-plan.md` §6](./build-plan.md#6-database-hosting-decision).

### 2026-05-23 — Ingestion endpoint lives in the API

No standalone OTel Collector for MVP. `betterlog-api` exposes `POST /v1/otlp/traces` directly. Customers already running a Collector point theirs at our endpoint later. Recorded in [`build-plan.md` §2](./build-plan.md#2-tech-stack).

## Decisions still to record here

- ClickHouse vs. Postgres for trace storage at scale beyond MVP. (Decision deferred until we have real volume.)
- Where the ingestion writer lives within the API process (route handler vs. background worker vs. queued). (Week 1 — start simple, revisit if Wilco volume forces it.)
- Auth strategy for the SDK → ingestion path. (`SPEC.md` §6 says single API key per workspace — Week 1 will lock the header format and key shape.)
- Capacity numbers (spans/sec, storage growth/day) once we have a measured baseline from Wilco staging — Week 3.
