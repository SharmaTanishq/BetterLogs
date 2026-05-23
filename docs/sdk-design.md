# SDK Design

> **Status:** TODO — stub. Will be filled in during MVP week 1 alongside SDK implementation.

The SDK is the only surface customers touch directly. It must be small, opinionated, and aggressively OTel-compatible. Two functions total in MVP: `withWorkflow` and `recordStep`.

## Planned contents

- The Node (TypeScript) SDK API surface: types, function signatures, error semantics, async patterns.
- The Python SDK API surface: equivalent ergonomics adapted to Python idioms (context managers, decorators, async).
- OTel integration details: which exporter to use, how `betterlog.*` span attributes are emitted, how the SDK plays with an existing OTel setup if the customer already has one.
- Context propagation across async boundaries: HTTP headers, RabbitMQ message properties, AWS SNS/SQS attributes, etc.
- Error handling philosophy: the SDK must never break the customer's app, even if BetterLog backend is down. Buffering, dropping, and circuit-breaker behavior.
- Configuration surface: env vars, config file format, programmatic config. Keep this tiny.
- Versioning policy and deprecation guarantees.

## Decisions to record here as they happen

- Decorator vs. wrapper function as the primary API for Python (`@workflow` vs. `with_workflow(...)`).
- Whether the SDK auto-starts spans for HTTP handlers (instrumentation packs) or stays minimal.
- How to handle workflows that span multiple processes / services without explicit context plumbing.
- Sampling strategy (probably 100% for MVP, configurable later).
