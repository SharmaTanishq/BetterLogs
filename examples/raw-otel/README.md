# @betterlog/example-raw-otel

Mirror of [`examples/wilco-order-demo`](../wilco-order-demo/) that hits the
BetterLog API using only `@opentelemetry/*` packages — **no
`@betterlog/sdk-node`, no `@betterlog/shared`, no `@betterlog/*` anything at
runtime**. The dependency block in [`package.json`](./package.json) is the
proof: every entry is an upstream OTel package.

This example exists to prove the BetterLog ingestion path is an open wire
format, not a vendored SDK. An external team can instrument their service
with vanilla OTel, follow the attribute conventions in
[`docs/otel-semantic-conventions.md`](../../docs/otel-semantic-conventions.md),
and produce identical `workflows` + `steps` rows to the SDK-flavoured
[`wilco-order-demo`](../wilco-order-demo/).

## What it does

Same scenario as `wilco-order-demo`: one `order.fulfillment` workflow with
three steps (`medusa.create_order` → `queue.published` → `back40.push`).
On the failure path the third step throws and the workflow ends `failed`.

The wiring is inline: about 130 lines of TypeScript, including the OTLP
exporter setup, the workflow root span, and a small `recordStep` helper
that mirrors the SDK's primitive without depending on it. Read the file
top-to-bottom — it's deliberately one screen of code.

## Prereqs

- API running locally: `pnpm --filter @betterlog/api dev`
- `BETTERLOG_API_URL` and `BETTERLOG_API_KEY` in the root `.env`

## Run

```bash
# Success path — three steps, workflow ends `success`.
pnpm --filter @betterlog/example-raw-otel start

# Failure path — back40.push throws, workflow ends `failed`.
FAIL_AT=back40 pnpm --filter @betterlog/example-raw-otel start
```

The API logs `OTLP batch ingested workflows=1 steps=3 skipped=0` on each
run. `skipped` should always be zero — if it isn't, you have an attribute
mismatch worth investigating.

## Verify

The rows produced by this example are indistinguishable from the SDK
demo's rows (modulo `service.name`, which is `raw-otel-demo` here vs
`wilco-order-demo` there). Use the same query against either:

```sql
-- Most recent workflow
select id, name, status, business_keys, started_at
from workflows
order by started_at desc
limit 1;

-- Steps for that workflow
select name, service, status, error->>'code' as code
from steps
where workflow_id = '<id-from-above>'
order by started_at;
```

Compare a row from this demo against a row from `wilco-order-demo` and
confirm the schema, statuses, and business-key conventions match. That
side-by-side equivalence is the entire point of this example.

## Related

- [`docs/otel-semantic-conventions.md`](../../docs/otel-semantic-conventions.md)
  — the wire-level spec this example implements.
- [`examples/wilco-order-demo/`](../wilco-order-demo/) — the SDK-flavoured
  version of the same scenario.
- [`packages/sdk-node/src/withWorkflow.ts`](../../packages/sdk-node/src/withWorkflow.ts)
  and [`recordStep.ts`](../../packages/sdk-node/src/recordStep.ts) — the
  SDK primitives whose attribute set this example reproduces by hand.
