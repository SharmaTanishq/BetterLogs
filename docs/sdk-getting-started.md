# Getting started with `@betterlog/sdk-node`

This is the day-one guide for installing the BetterLog Node SDK in a customer service and getting a real workflow into the database. It covers the two primitives (`withWorkflow`, `recordStep`), the bootstrap (`init`, `shutdown`), the env vars, the failure semantics, and the gotchas that bite people the first week.

For the product framing and data model see [`SPEC.md`](../SPEC.md). For internal SDK design notes see [`docs/sdk-design.md`](./sdk-design.md). This document is the customer-facing surface.

## What is BetterLog

BetterLog is a workflow diagnosis tool that turns OpenTelemetry spans into named, case-keyed business workflows — `order.fulfillment` for order `#1234`, `agent.run` for run `abc123`, `invoice.sync` for invoice `INV-99`. Engineers declare the workflow shape in code; the backend stitches the spans into a structured timeline you can query by business key and diagnose with one LLM call.

It is **explicitly not** an observability platform. Datadog, Honeycomb, Sentry, and Grafana already own that. BetterLog sits on top of your existing OTel pipeline (or runs as its own thin one) and adds the case-level layer — "what happened to *this* order" — that the general-purpose tools don't answer well.

## What the SDK does

`@betterlog/sdk-node` is a thin wrapper around `@opentelemetry/api` that emits spans with a fixed set of `betterlog.*` attributes. The API service reads those attributes, classifies each span as a workflow or a step, and writes the corresponding rows to Postgres. The SDK itself does nothing clever: the contract is the attribute set, and the moat is that the workflow shape is declared at the call site, not inferred from span timing.

If you already run an OTel SDK, you don't need this package — you can set the same attributes directly. See [The SDK vs. the wire format](#the-sdk-vs-the-wire-format) immediately below for the explicit framing, and [Configuring bring-your-own OpenTelemetry](#configuring-bring-your-own-opentelemetry) further down for the operational details.

## Mental model

Three concepts, each with one job:

- **Workflow** — one execution of a named business process. `order.fulfillment` for order `#1234` is one workflow. The same workflow for order `#1235` is a separate one. A workflow has a single root span (`workflow:<name>`), a status (`running | success | failed`), and a set of business keys.
- **Step** — a unit of work inside a workflow. Every `recordStep` call is one step. Steps automatically attach to the surrounding workflow via OTel context propagation.
- **Business key** — the identifier humans actually use. `order_id`, `run_id`, `invoice_id`, `customer_id`. Always strings (Postgres stores them in a `JSONB` column with a GIN index so `WHERE business_keys @> '{"order_id":"1234"}'` is fast).

End-to-end:

```
Your code
  └─ withWorkflow({...}, async () => {            ← root span: workflow:<name>
       await recordStep({...}, () => doThing())   ← child span: step:<name>
       await recordStep({...}, () => doOther())   ← child span: step:<name>
     })
       │
       │  OTLP/HTTP (BatchSpanProcessor)
       ▼
  betterlog-api  POST /v1/otlp/traces
       │
       │  parseExport() classifies spans by name prefix
       ▼
  Postgres
    workflows row   (id, name, business_keys, status, trace_id, ...)
    steps rows      (id, workflow_id, name, service, status, input, output, error)
       │
       ▼
  betterlog diagnose "what happened to order 1234?"
```

## The SDK vs. the wire format

`@betterlog/sdk-node` is convenience sugar over an open attribute schema. The contract the BetterLog API enforces is the set of `betterlog.*` span attributes documented in [`docs/otel-semantic-conventions.md`](./otel-semantic-conventions.md), not the SDK function signatures. The same workflow row lands in Postgres whether the SDK emitted the span, your existing OTel pipeline did, or a Python service hand-rolled it.

The SDK-flavoured call:

```typescript
await withWorkflow(
  { name: "order.fulfillment", businessKeys: { order_id: "1234" } },
  async () => { /* steps */ },
);
```

The same span produced with `@opentelemetry/api` only:

```typescript
await tracer.startActiveSpan(
  "workflow:order.fulfillment",
  {
    attributes: {
      "betterlog.workflow.id": workflowId,         // ulid you control
      "betterlog.workflow.name": "order.fulfillment",
      "betterlog.workflow.version": "0.0.0",
      "betterlog.workflow.environment": "development",
      "betterlog.business.order_id": "1234",
    },
  },
  async (span) => {
    try { /* steps */ span.setStatus({ code: SpanStatusCode.OK }); }
    catch (err) { span.setStatus({ code: SpanStatusCode.ERROR }); throw err; }
    finally { span.end(); }
  },
);
```

Both produce the same `workflows` row.

If you ever want out, replace the SDK with a 50-line shim or talk to OTel directly. The wire format is documented at [`docs/otel-semantic-conventions.md`](./otel-semantic-conventions.md). The raw-OTel reference implementation is at [`examples/raw-otel/`](../examples/raw-otel/) — a full mirror of the `wilco-order-demo` scenario with zero `@betterlog/*` runtime imports.

## Install

The package is not on a public registry yet. Two installation modes:

```bash
# Inside this monorepo (the agent and order-demo examples use this):
pnpm add @betterlog/sdk-node@workspace:*

# Outside the monorepo: build a tarball and install it directly.
pnpm --filter @betterlog/sdk-node pack
pnpm add /absolute/path/to/betterlog-sdk-node-0.1.0.tgz
```

Requires Node 22+ (the SDK uses ES modules and `AsyncLocalStorage`-backed OTel context).

## Hello world

The full runnable version lives at [`examples/wilco-order-demo/src/index.ts`](../examples/wilco-order-demo/src/index.ts). The minimal shape:

```typescript
import { init, recordStep, shutdown, withWorkflow } from "@betterlog/sdk-node";

init({
  serviceName: "ecom-middleware",
  // apiUrl + apiKey default to BETTERLOG_API_URL / BETTERLOG_API_KEY env vars
});

try {
  await withWorkflow(
    {
      name: "order.fulfillment",
      businessKeys: { order_id: "1234", order_value_cents: "8900" },
    },
    async () => {
      await recordStep(
        { name: "medusa.create_order", service: "ecom-middleware" },
        async () => ({ medusaOrderId: "1234", status: "created" }),
      );

      await recordStep(
        { name: "back40.push", service: "omniapi-services" },
        async () => ({ back40OrderId: "b40-1234" }),
      );
    },
  );
} finally {
  await shutdown();
}
```

Run it once. What you should see, in order:

1. The API logs one `OTLP batch ingested workflows=1 steps=2 skipped=0`.
2. One row in `workflows`:

```bash
pnpm db:psql -c "SELECT id, name, status, business_keys FROM workflows ORDER BY started_at DESC LIMIT 1;"
```

3. Two rows in `steps`:

```bash
pnpm db:psql -c "SELECT name, service, status FROM steps WHERE workflow_id = '<id from above>' ORDER BY started_at;"
```

4. The CLI can find the workflow by business key:

```bash
betterlog diagnose "what happened to order 1234?"
```

If any of those don't happen, jump to [Troubleshooting](#troubleshooting).

## Required environment variables

| Var | What it is | Override |
|---|---|---|
| `BETTERLOG_API_URL` | Base URL of the BetterLog API. SDK posts to `${BETTERLOG_API_URL}/v1/otlp/traces`. | `init({ apiUrl })` |
| `BETTERLOG_API_KEY` | Workspace API key. Sent as `Authorization: Bearer <key>`. | `init({ apiKey })` |

Both are read inside `init`. If neither the env var nor the explicit argument is set, `init` throws synchronously at boot — better a crash than silent dropped traces.

For local dev, `.env.example` ships defaults pointing at `http://localhost:4000` with key `blg_dev_localonly`, which matches the API's default in `apps/api/src/config.ts`. Don't use those values in production.

## The two primitives in depth

### `withWorkflow(opts, fn)`

```typescript
await withWorkflow(
  {
    name: "order.fulfillment",        // required
    businessKeys: { order_id: "1234" }, // required
    workflowId: "01HXY...",           // optional, defaults to a fresh ulid
    version: "1.0.0",                 // optional, default "0.0.0"
    environment: "production",        // optional, defaults to NODE_ENV or "development"
    metadata: { source: "stripe-webhook" }, // optional, JSON-stringified onto the span
  },
  async ({ workflowId }) => { /* your code */ },
);
```

| Option | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | required | Dotted lowercase. The string ops will read; choose deliberately. |
| `businessKeys` | `Record<string, string>` | required | All values must be strings. Stored as JSONB; queried with `@>` containment. |
| `workflowId` | `string` | fresh ulid | Pass explicitly only for cross-process workflows (see below). |
| `version` | `string` | `"0.0.0"` | Customer-controlled; lets you track behavior across deploys. |
| `environment` | `string` | `process.env.NODE_ENV \|\| "development"` | Just a tag — no environment promotion logic anywhere. |
| `metadata` | `Record<string, unknown>` | none | Free-form. `JSON.stringify`'d onto `betterlog.workflow.metadata`. **Unserializable values (circular refs, BigInts) are silently dropped.** |

**Behavior:**

- Opens a span named `workflow:<name>` and runs `fn` inside its active context.
- Returns whatever `fn` returns.
- On success: span status `OK`, workflow row ends `status='success'`.
- On throw: span records the exception, span status `ERROR`, workflow row ends `status='failed'`, the error re-throws. Your existing error handling is untouched.
- The active workflow frame (`id`, `name`, `version`, `environment`) is stored in OTel context. Any `recordStep` inside `fn` — even across `await`, `setImmediate`, or `Promise.all` boundaries — picks it up automatically.

**Cross-process workflows.** When the same business process spans multiple services (e.g., RabbitMQ producer + consumer, sync RPC chains), generate the `workflowId` in the producer, ship it in the message metadata, and pass it explicitly to `withWorkflow` on the consumer side:

```typescript
// Producer
const workflowId = ulid();
await withWorkflow({ name: "order.fulfillment", workflowId, businessKeys: { order_id } }, async () => {
  await rabbit.publish({ ...payload, _betterlog: { workflow_id: workflowId } });
});

// Consumer (different process)
await withWorkflow(
  { name: "order.fulfillment", workflowId: msg._betterlog.workflow_id, businessKeys: { order_id } },
  async () => { /* consumer side of the workflow */ },
);
```

Both services produce spans tagged with the same `betterlog.workflow.id`. The API upserts on workflow id, so the two halves merge into one row with all steps attached. See [`docs/rabbitmq-tracing.md`](./rabbitmq-tracing.md) for the long version (currently a stub; the canonical guide once written).

### `recordStep(opts, fn?)`

Two shapes — choose based on whether you have an async call to wrap.

**Wrapping form** (use this 95% of the time):

```typescript
const result = await recordStep(
  {
    name: "back40.push",
    service: "omniapi-services",
    input: { orderId, lineItems: order.lineItems.length },
  },
  () => back40Client.push(order),
);
```

**Fire-and-forget form** — single-shot event, no callback. Use only for state transitions you don't naturally wrap (queue acks, webhook delivery confirmations):

```typescript
recordStep({
  name: "queue.published",
  service: "ecom-middleware",
  status: "success",        // required in this shape — there's no fn to derive it from
  output: { messageId },
});
```

| Option | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | required | Dotted, prefixed by the service or external system: `medusa.create_order`, `back40.push`. |
| `service` | `string` | required | Logical service name — what shows in `steps.service`. Doesn't have to match the OTel `service.name` resource attribute, but usually does. |
| `status` | `"started" \| "success" \| "failed" \| "skipped" \| "retrying"` | `"started"` (wrapping form) | Required in the fire-and-forget form. In the wrapping form, overwritten to `success` or `failed` based on whether `fn` throws. |
| `input` | `unknown` | none | `JSON.stringify`'d onto `betterlog.step.input`. Pass the whole payload — the diagnose agent needs context. |
| `output` | `unknown` | none | Same. In the wrapping form, if `fn` returns a value it's auto-captured as the output. |

**Behavior:**

- Opens a span named `step:<name>` as a child of the active workflow span (via OTel context).
- Wrapping form: marks the step `success` on resolve, `failed` on throw. On throw, captures the error via `serializeError` (name, message, stack, code, plus any own enumerable properties) onto `betterlog.step.error` and re-throws.
- Fire-and-forget form: opens and immediately ends the span. No exception handling — the caller is asserting the outcome.
- If there is no active workflow when `recordStep` runs, the span is still emitted but **lacks the `betterlog.workflow.id` attribute**, and the API's OTLP parser will skip it. Always wrap step calls in `withWorkflow`.

## Error handling and how failures propagate

There are three error paths to understand, and they interact in ways that surprise people.

**1. A `recordStep` callback throws.** The step span gets `status='failed'`, the error is serialized onto `betterlog.step.error`, the exception re-throws so your existing handling fires. The workflow status is *not* directly affected by this — it's affected by whether the throw propagates out of `withWorkflow`'s `fn`.

**2. A `withWorkflow` callback throws** (either re-thrown from a step or from your own code). The workflow span gets `status='failed'`. This is the trigger that matters for diagnosis: the failure-embedding poller in `apps/api/src/embeddings/poller.ts` scans for `workflows.status = 'failed'` rows every 30 seconds, embeds the failure signature (workflow + last failed step), and stores it in `failure_embeddings` for similarity search. **If you swallow the throw inside `withWorkflow`, the workflow ends `success` and the poller will never pick it up.**

**3. The Vercel AI SDK case (and friends).** Some libraries catch thrown errors internally and surface them as data — `generateText` from `ai` v6 returns tool errors as `content` parts of type `tool-error` rather than throwing. If you want such a run to count as a workflow failure, you have to inspect the result and re-throw yourself. The agent example at `examples/agent-vercel-ai/src/index.ts` does exactly this.

Concrete recommendation: decide deliberately at each level whether an error means "this workflow failed." If yes, let it propagate (or re-throw it explicitly). If no, swallow it below the `withWorkflow` boundary and the workflow records `success`. Don't try to half-fail a workflow.

## Cross-service workflows

The hard case. A workflow can only be one row in `workflows`; for that row to span multiple processes, every process has to call `withWorkflow` with the same `workflowId`.

The mechanism is plain. Generate the id once (preferably in the process that owns the business event — the HTTP handler that accepted the order, the cron tick that started the sync), thread it through whatever transport the steps cross (queue message headers, HTTP request headers, RPC metadata), and reconstruct it on the other side:

```typescript
// In the API handler that receives the order
const workflowId = ulid();
await withWorkflow(
  { name: "order.fulfillment", workflowId, businessKeys: { order_id } },
  async () => {
    await medusa.createOrder(payload);
    await rabbit.publish("omniapi-tasks", {
      ...orderPayload,
      _betterlog: { workflow_id: workflowId },
    });
  },
);

// In the consumer service, on receiving the message
await withWorkflow(
  {
    name: "order.fulfillment",
    workflowId: message._betterlog.workflow_id,
    businessKeys: { order_id: message.order_id },
  },
  async () => {
    await recordStep(
      { name: "back40.push", service: "omniapi-services", input: message },
      () => back40.push(message),
    );
  },
);
```

The ingestion path is idempotent on workflow id (`ON CONFLICT DO UPDATE`), so the two `withWorkflow` calls merge into one row in storage with all steps from both processes attached.

For an in-depth treatment of header injection / extraction across messaging systems — especially RabbitMQ, which is the hardest of the bunch — see [`docs/rabbitmq-tracing.md`](./rabbitmq-tracing.md). It's currently a stub but will be the canonical guide.

## Configuring bring-your-own OpenTelemetry

The conceptual framing — SDK vs. wire format — is covered in [The SDK vs. the wire format](#the-sdk-vs-the-wire-format) above. The operational notes for using the SDK helpers on top of an existing OTel provider, without double-initializing:

- **Do not call `init()`** if your service already runs an OTel SDK. It would register a second tracer provider; the first one wins, the second one's exporter never sees anything, and you spend an afternoon debugging it. `withWorkflow` and `recordStep` pull the tracer via `trace.getTracer()` and piggyback on whatever provider is registered globally.
- Route spans with `betterlog.*` attributes to `${BETTERLOG_API_URL}/v1/otlp/traces` either by adding a second OTLP/HTTP exporter to your existing provider (`Authorization: Bearer ${BETTERLOG_API_KEY}`) or by configuring your OTel Collector with a second `otlphttp` exporter at the same endpoint.

If you want to skip the SDK helpers entirely and emit the attributes yourself, the full schema and a worked example live at [`docs/otel-semantic-conventions.md`](./otel-semantic-conventions.md) and [`examples/raw-otel/`](../examples/raw-otel/).

## Verifying it works

A short checklist when you're standing up the SDK in a new service:

1. **API reachable.** `curl $BETTERLOG_API_URL/health` returns `{"status":"ok","db":"ok",...}`. A 503 means the API is up but Postgres isn't; a connection-refused means the URL or network path is wrong.
2. **Auth working.** Run the hello-world once. In the API logs (`pnpm --filter @betterlog/api dev`), look for `OTLP batch ingested workflows=1 steps=N skipped=0`. A 401 in your service's logs with `Bearer auth failed` (or no API logs at all) means the key is wrong.
3. **Rows landed.** `pnpm db:psql -c "SELECT id, name, status, started_at FROM workflows ORDER BY started_at DESC LIMIT 1;"` shows the workflow. Then `SELECT name, service, status FROM steps WHERE workflow_id = '<id>' ORDER BY started_at;`.
4. **CLI sees it.** `betterlog diagnose "what happened to order 1234?"` returns a real answer with the step names you used.
5. **Failure path.** Trigger a failure (the demo has `FAIL_AT=back40`). Wait 30 seconds, then `SELECT workflow_id, substr(summary, 1, 80) FROM failure_embeddings ORDER BY workflow_id DESC LIMIT 1;` shows the failure embedding row.

The single most common reason ingestion looks broken is the `BatchSpanProcessor` flush. The SDK uses OTel's `BatchSpanProcessor`, which queues spans and ships them in batches. If your process exits before the last batch is sent — for a script, a CLI tool, a cron job, a serverless handler — the last few spans never leave. Always `await shutdown()` in a `finally` block or `SIGTERM` handler. Long-running web services don't notice this because new spans keep flushing each other along.

## Examples in this repo

Four runnable examples. The first three use the SDK's `init` / `withWorkflow` / `recordStep` surface; the fourth proves the same rows can be produced without it.

- [`examples/wilco-order-demo/`](../examples/wilco-order-demo/) — minimal end-to-end. One workflow, three steps (`medusa.create_order` → `queue.published` → `back40.push`), optional failure path via `FAIL_AT=back40`. The canonical "does my install work" smoke test.
- [`examples/agent-vercel-ai/`](../examples/agent-vercel-ai/) — multi-tool research agent built with the Vercel AI SDK (`generateText` + `stepCountIs`). Each tool call lands as a step under one `agent.run` workflow. Default mode (`MODE=fail`) forces a deterministic tool failure so you can exercise the failure-embedding pipeline end-to-end.
- [`examples/agent-openai-agents/`](../examples/agent-openai-agents/) — the same scenario implemented against the OpenAI Agents SDK. Running both is the easiest way to see `find_similar_failures` light up — two failures of the same shape from different agent stacks.
- [`examples/raw-otel/`](../examples/raw-otel/) — mirror of `wilco-order-demo` with zero `@betterlog/*` runtime imports. Pure `@opentelemetry/*` packages plus the documented attribute names. Read this if you want to audit the wire format or build a producer in another language / stack.

## Troubleshooting

**My workflow isn't showing up in the DB.**
Three things to check, in order:
1. Did you `await shutdown()`? Without it, the `BatchSpanProcessor` may have queued the spans but never sent them. This is the most common cause for one-shot scripts.
2. Is `BETTERLOG_API_URL` reachable from the service? `curl $BETTERLOG_API_URL/health` from the same network.
3. Is the API key right? The API logs `unauthorized` on a 401 — if you see those, your `BETTERLOG_API_KEY` doesn't match the API's configured key.

**Steps appear but the workflow doesn't.**
`withWorkflow` must wrap the `recordStep` calls. Orphan `recordStep` calls (no active workflow context) emit spans without `betterlog.workflow.id`, and the OTLP parser at `apps/api/src/ingestion/otlp-parse.ts` skips any step span missing that attribute (see `spanToStep`, which returns `null` when `workflowId` is undefined). Check that your `recordStep` calls run inside the `withWorkflow` callback, including across async boundaries — the context is propagated via OTel's `AsyncLocalStorage`, but only if the boundary is one Node respects (`await`, `Promise.then`, `setImmediate`, native event emitters).

**A workflow shows `success` even though a step failed.**
`recordStep` re-throws on failure by default. If you `try/catch` around it inside the workflow callback and don't re-throw, the workflow ends `success` from BetterLog's point of view — because the workflow's `fn` returned cleanly. Decide deliberately whether each step failure is fatal at the workflow level. If yes, let it propagate. If no, swallow it and the workflow records `success`. Half-failed isn't a state.

**A library is swallowing errors I expected to fail the workflow.**
The Vercel AI SDK's `generateText` is the common case: it surfaces tool errors as `content` parts of type `tool-error` rather than throwing. If you want those runs to register as workflow failures, inspect the result and re-throw yourself. The pattern is in [`examples/agent-vercel-ai/src/index.ts`](../examples/agent-vercel-ai/src/index.ts).

**No failure embedding appears for a failed workflow.**
Embeddings only land for workflows where `status='failed'`. The poller (`apps/api/src/embeddings/poller.ts`) runs every 30 seconds, so wait. If embeddings never land at all, check:
- `OPENAI_API_KEY` is set on the API (the embedder uses OpenAI's `text-embedding-3-small`).
- `BETTERLOG_EMBEDDING_ENABLED` is not `false`.
- The API logs `failure-embedding tick scanned=N embedded=N` every 30s when there's work to do.

**I can't find my workflow by `order_id`.**
Business keys are matched on the `business_keys` JSONB column using `@>` containment. The key name and value are case-sensitive strings. `order_id: "1234"` won't match a query for `OrderId: 1234`. Always store values as strings, even for numeric IDs — the column rejects non-strings.

**`init` throws `apiUrl missing` or `apiKey missing` at boot.**
Neither the env var nor the explicit `init({ apiUrl, apiKey })` arg is set. This is intentional — failing fast at startup beats silently dropping all spans for a misconfigured service. Set both before calling `init`.

**Calling `init` twice does nothing.**
Idempotent by design. The second call is a no-op. If you need to change configuration after `init`, you have to `await shutdown()` first, then call `init` again with the new options.

## What the SDK does NOT do

- It does not ship metrics or logs. Only spans. Use your existing pipeline for those.
- It does not auto-instrument anything — no HTTP middleware, no DB query interception. You call `recordStep` explicitly. Explicit is the point: the workflow contract is the moat.
- It does not replace your existing OTel SDK. If you have one, don't call `init`; just emit the `betterlog.*` attributes onto your existing spans.
- It does not retry, buffer to disk, or queue durably. The `BatchSpanProcessor` keeps an in-memory queue and drops spans if the API is unreachable for long enough. Acceptable trade-off for diagnosis-only data; not acceptable for billing-grade data.
- It does not have a Python equivalent yet. Deferred per [`docs/build-plan.md`](./build-plan.md) §2 until a customer needs it.
- It does not include a `replayWorkflow` primitive. Deferred to v2 per [`SPEC.md`](../SPEC.md) §6.

## Where to go next

- [`docs/otel-semantic-conventions.md`](./otel-semantic-conventions.md) — the wire-level attribute schema the BetterLog API ingests. The contract this SDK is sugar over. Read this if you're writing a Python/Go/Java equivalent or instrumenting without `@betterlog/sdk-node`.
- [`SPEC.md`](../SPEC.md) — product framing, data model, and the 10 example questions BetterLog must answer.
- [`docs/business_context.md`](./business_context.md) — positioning. The SDK call sites are the workflow contract, which is the moat.
- [`docs/sdk-design.md`](./sdk-design.md) — internal SDK design notes (mostly empty; the source of truth for ergonomics decisions).
- [`docs/rabbitmq-tracing.md`](./rabbitmq-tracing.md) — async context propagation playbook (currently a stub).
- [`packages/cli/README.md`](../packages/cli/README.md) — the CLI that reads what the SDK writes.
- [`packages/shared/src/otel-attributes.ts`](../packages/shared/src/otel-attributes.ts) — the canonical list of `betterlog.*` attributes, if you're emitting spans without this SDK.
