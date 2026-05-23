# Architecture

> **Status:** TODO — stub. Will be filled in during MVP week 0-1.

This document will expand on the architecture summary in [`SPEC.md`](../SPEC.md) Section 5. It is the place to capture decisions that are too detailed for the spec but too important to live only in code.

## Planned contents

- Component-by-component design: SDK, OTel ingestion path, Postgres schema, diagnosis API, CLI, optional outgoing webhook.
- Deployment topology for the Wilco rollout (Kubernetes manifests, environment variables, secrets handling).
- Request flows: span ingestion, diagnosis request, outgoing-webhook alert delivery, remediation capture via CLI.
- Failure modes and degradation strategy (what happens when the LLM is slow, when ingestion is backed up, when Postgres is unavailable).
- Capacity assumptions for the MVP scale (Wilco order volume, expected spans/sec, storage growth).
- Migration / upgrade strategy for the data model as it evolves post-MVP.

## Decisions to record here as they happen

- ClickHouse vs. Postgres for trace storage at scale beyond MVP.
- OTel collector deployment model (sidecar vs. central).
- Where the ingestion writer lives (separate service vs. extension of the API).
- Auth strategy for the SDK → ingestion path (mTLS, API keys, OTel-native auth).
