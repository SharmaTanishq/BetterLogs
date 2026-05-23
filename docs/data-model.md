# Data Model

> **Status:** TODO — stub. The canonical data model lives in [`SPEC.md`](../SPEC.md) Section 3. This document will expand it once the MVP is built.

## Planned contents

- Full DDL with all indexes, including the rationale for each index choice.
- Schema versioning strategy: how `Workflow.version` evolves, how breaking changes are handled, migration playbook.
- Cardinality discussion: expected row counts per table at Wilco scale (orders/day x steps/order x retention), and when to revisit storage choice.
- Retention policy: how long do we keep workflows, steps, events, embeddings? Tiered storage strategy if needed.
- Payload capture allow-list mechanism: how customers declare which fields of step input/output are safe to persist (PII guard).
- Business key conventions: rules for what makes a good business key, how multiple keys per workflow are correlated.
- The OTel attribute conventions for `betterlog.*` namespaces, with examples for each language SDK.

## Decisions to record here as they happen

- Whether to denormalize step counts onto the `workflows` table for fast aggregation.
- Whether `events` is needed at all in MVP or if everything can be modeled as a step.
- Embedding model choice for failure signatures (OpenAI ada-002, voyage, local).
- How to encode async boundaries (RabbitMQ enqueue/dequeue) in the data model.
