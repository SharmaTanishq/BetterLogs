# @betterlog/sdk-node

`@betterlog/sdk-node` is convenience sugar over the BetterLog OTel semantic conventions ([spec](../../docs/otel-semantic-conventions.md)). Your spans are standard OpenTelemetry — this SDK is one of several ways to emit them. If you'd rather call OTel directly, follow the spec or copy [`examples/raw-otel/`](../../examples/raw-otel/); the API ingests both paths identically.

The two primitives (`withWorkflow`, `recordStep`) wrap your business code in workflow + step spans with a fixed set of `betterlog.*` attributes. The BetterLog API stitches them into named, case-keyed workflows you can diagnose with `betterlog diagnose "what happened to order 1234?"`. The workflow shape is declared at the call site, not inferred from span timing — that declaration is the contract, not the SDK surface itself.

## Install

```bash
pnpm add @betterlog/sdk-node
```

Not on npm yet — install via tarball or workspace dep. See [`docs/sdk-getting-started.md`](../../docs/sdk-getting-started.md#install) for the current options.

Requires Node 22+.

## Hello world

```typescript
import { init, recordStep, shutdown, withWorkflow } from "@betterlog/sdk-node";

init({ serviceName: "ecom-middleware" });
// apiUrl + apiKey default to BETTERLOG_API_URL / BETTERLOG_API_KEY env vars

try {
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
} finally {
  await shutdown();
}
```

One run produces one row in `workflows` and two rows in `steps`, queryable by `business_keys @> '{"order_id":"1234"}'`.

## Primitives

| Function | What it does |
|---|---|
| `init(opts)` | Boots a `NodeTracerProvider` and points its OTLP/HTTP exporter at `${apiUrl}/v1/otlp/traces`. Idempotent. **Do not call** if your service already runs an OTel SDK. |
| `withWorkflow(opts, fn)` | Opens a root span `workflow:<name>` with `betterlog.workflow.*` and `betterlog.business.*` attributes. `recordStep` calls inside `fn` (transitively, across `await`) become its children automatically. Throws from `fn` mark the workflow `failed`. |
| `recordStep(opts, fn?)` | Opens a child span `step:<name>`. With `fn`: auto-marks `success`/`failed` based on whether it throws. Without `fn`: fire-and-forget single-shot event (requires explicit `status`). |
| `shutdown()` | Flushes the `BatchSpanProcessor` queue and tears down the provider. **Call this** in your `SIGTERM` handler or a `finally` block — without it, the last batch may never leave the process. |

Full options tables, error-propagation semantics, and the cross-process / BYO-OpenTelemetry recipes are in [`docs/sdk-getting-started.md`](../../docs/sdk-getting-started.md).

## Sharp edges worth knowing up front

- **Always `await shutdown()`** for scripts, CLIs, cron jobs, and serverless handlers. The `BatchSpanProcessor` queues spans in memory; without a flush, the last batch is lost.
- **`withWorkflow` doesn't auto-fail** if you catch the error inside the callback. Re-throw if the failure means the business outcome failed — that's the trigger for failure-embedding similarity search.
- **Bring-your-own OpenTelemetry**: if you already have a tracer provider registered, don't call `init()`. `withWorkflow` / `recordStep` use the global tracer and will piggyback on your existing exporter.
- **Orphan steps are dropped**. `recordStep` outside an active `withWorkflow` emits a span without `betterlog.workflow.id`; the API parser silently skips it. Always wrap.
- **Step spans are held until the workflow ends.** `init()` wraps the OTLP exporter in a `WorkflowAwareSpanProcessor` so step spans never reach the API before their parent workflow span. Without this, slow workflows (agent runs that take longer than `BatchSpanProcessor`'s 5s scheduled flush) ship orphan step batches that the API rejects on FK violation. If you bring your own OpenTelemetry pipeline, you opt out of this — see [the troubleshooting note in `docs/sdk-getting-started.md`](../../docs/sdk-getting-started.md#troubleshooting) for the workaround.

## Examples

- [`examples/wilco-order-demo/`](../../examples/wilco-order-demo/) — minimal three-step workflow, optional failure path via `FAIL_AT=back40`.
- [`examples/agent-vercel-ai/`](../../examples/agent-vercel-ai/) — multi-tool research agent, Vercel AI SDK, one workflow per `agent.run`.
- [`examples/agent-openai-agents/`](../../examples/agent-openai-agents/) — the same scenario via the OpenAI Agents SDK.

Want to use raw OTel instead? See [`examples/raw-otel/`](../../examples/raw-otel/) and [`docs/otel-semantic-conventions.md`](../../docs/otel-semantic-conventions.md).

## License

UNLICENSED for now; license decision is deferred per [`SPEC.md`](../../SPEC.md) §6.
