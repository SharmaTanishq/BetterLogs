# @betterlog/sdk-node

Two-primitive Node SDK for BetterLog. Wraps your code in workflow + step spans, ships them over OTLP to your BetterLog API.

> **Design constraint:** this SDK must never break your app. If the BetterLog API is down, spans are dropped silently and your business code keeps running.

## Installation

Until BetterLog ships on npm, the SDK is distributed as a tarball.

```bash
pnpm add /path/to/betterlog-sdk-node-0.1.0.tgz
# or, in a Wilco service repo:
# 1) copy the .tgz into the repo (e.g. vendor/betterlog-sdk-node-0.1.0.tgz)
# 2) pnpm add ./vendor/betterlog-sdk-node-0.1.0.tgz
```

Then point it at the deployed API:

```ts
import { init } from "@betterlog/sdk-node";

init({
  serviceName: "ecom-middleware",
  apiUrl: "https://betterlog-api.fly.dev",
  apiKey: process.env.BETTERLOG_API_KEY!,
});
```

Requires Node 22+.

## Quick start

```typescript
import { init, withWorkflow, recordStep } from "@betterlog/sdk-node";

init({
  serviceName: "ecom-middleware",
  serviceVersion: "1.4.2",
  // apiUrl + apiKey default to BETTERLOG_API_URL + BETTERLOG_API_KEY env vars
});

await withWorkflow(
  {
    name: "order.fulfillment",
    businessKeys: { order_id: "1234", order_value_cents: "8900" },
  },
  async () => {
    await recordStep(
      { name: "medusa.create_order", service: "ecom-middleware" },
      () => medusa.createOrder(payload),
    );

    await recordStep(
      { name: "back40.push", service: "omniapi-services" },
      () => back40.push(order),
    );
  },
);
```

That's the entire customer-facing API. Two functions. Everything else (span context, trace IDs, attributes, OTLP export) is automatic.

---

## API

### `init(options)`

Boots the OTel tracer provider and points its exporter at your BetterLog API. Call once at process startup, before any `withWorkflow` / `recordStep` call. Idempotent — second call is a no-op.

```typescript
init({
  serviceName: "ecom-middleware",     // required, shows up on every span as service.name
  serviceVersion: "1.4.2",            // optional, defaults to "0.0.0"
  apiUrl: "https://api.example.com",  // optional, defaults to BETTERLOG_API_URL env
  apiKey: "blg_xxx",                  // optional, defaults to BETTERLOG_API_KEY env
});
```

If `apiUrl` or `apiKey` is missing (no arg and no env var), `init` throws synchronously. Better a crash at boot than silent dropped traces.

### `withWorkflow(opts, fn)`

Wraps an async function as a root workflow span. Anything `recordStep` does inside `fn` (transitively, across async boundaries) becomes a child of this span.

```typescript
await withWorkflow(
  {
    name: "order.fulfillment",       // required
    businessKeys: { order_id: "1234" }, // required — what humans search by
    version: "1.0.0",                // optional, default "0.0.0"
    environment: "production",       // optional, defaults to NODE_ENV or "development"
    workflowId: "wf_abc...",         // optional, defaults to a fresh ulid
  },
  async ({ workflowId }) => {
    // your business code; workflowId is the ulid that just got generated
  },
);
```

If `fn` throws, the span is marked `ERROR`, the exception is recorded, and the error re-throws. Your existing error handling is untouched.

Returns whatever `fn` returns.

### `recordStep(opts, fn?)`

Two shapes:

**Wrapping form** — opens a span around an async call, auto-records success/failure.

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

If the callback throws, the step is marked `failed` and the error re-throws.

**Event form** — single-shot, no callback. Use for state transitions you don't wrap.

```typescript
recordStep({
  name: "queue.published",
  service: "ecom-middleware",
  status: "success",
  output: { messageId: msg.id },
});
```

`input` / `output` are stored as raw JSON. Pass the whole payload — the LLM needs the full picture to diagnose failures.

### `shutdown()`

Flushes the span queue and tears down the tracer. Call in your graceful-shutdown handler so spans aren't lost on `SIGTERM`.

```typescript
process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});
```

### `getTracer()`

Escape hatch — returns the underlying OTel `Tracer`. Use this if you need to create spans directly (e.g., to instrument a library that's not naturally wrappable). 95% of the time you should use `withWorkflow` + `recordStep` instead.

---

## Configuration

| Setting | Env var | Programmatic | Default |
|---|---|---|---|
| API URL | `BETTERLOG_API_URL` | `init({ apiUrl })` | _required_ |
| API key | `BETTERLOG_API_KEY` | `init({ apiKey })` | _required_ |
| Service name | _n/a_ | `init({ serviceName })` | _required_ |
| Service version | _n/a_ | `init({ serviceVersion })` | `"0.0.0"` |

The OTLP exporter posts to `${apiUrl}/v1/otlp/traces` with `Authorization: Bearer ${apiKey}`.

---

## Existing OpenTelemetry setup

If your service already runs an OTel SDK, **do not call `init()`**. The BetterLog primitives use `trace.getTracer()` from `@opentelemetry/api`, which finds whatever provider is registered. To send spans to BetterLog, add an OTLP exporter to your existing provider pointing at `${api_url}/v1/otlp/traces`.

The SDK sets `betterlog.workflow.*`, `betterlog.business.*`, and `betterlog.step.*` attributes on spans. Anyone who already emits those attributes from their own instrumentation (per `SPEC.md` §3 attribute mapping) gets BetterLog support without using this SDK at all.

---

## Error semantics

The SDK is built so it cannot crash your app:

- `init` validates required config and throws **at boot**, never at request time.
- `withWorkflow` / `recordStep` re-throw whatever your callback throws — error handling stays yours.
- OTLP export failures are logged at debug level by the OTel SDK and **never propagate**. If the BetterLog API is down or unreachable, your business code completes normally and the spans are dropped after the BatchSpanProcessor retries.

---

## Conventions

- **Workflow names** are dotted lowercase: `order.fulfillment`, `refund.processing`, `inventory.sync`.
- **Step names** are dotted, prefixed by the service or external system: `medusa.create_order`, `back40.push`, `queue.published`.
- **Business keys** are stringly-typed JSON. The canonical example is `order_id: "1234"`. Also store a numeric outcome (e.g. `order_value_cents: "8900"`) as a string when available — see `SPEC.md` §3.

---

## Status

MVP. Surface area is intentionally tiny per `SPEC.md` §5. Python SDK deferred (`docs/build-plan.md` §2). Allow-list helper, RabbitMQ context-injection helper, and a `replayWorkflow` primitive are post-MVP.
