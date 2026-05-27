# BetterLog OTel semantic conventions

## What this document is

BetterLog ingests any OpenTelemetry span that follows the conventions on this page. The `@betterlog/sdk-node` package ([source](../packages/sdk-node/), [getting-started guide](./sdk-getting-started.md)) is one implementation of these conventions — it sets the attributes for you and forwards spans over OTLP/HTTP. This document is the wire-level contract that the BetterLog API ingests. A Python SDK, a Go SDK, a hand-rolled `@opentelemetry/api` call, or an OTel Collector processor that decorates existing spans with `betterlog.*` attributes are all equally valid producers; the API does not care which one emitted the span.

If you want a worked, runnable producer that uses only `@opentelemetry/*` packages with no `@betterlog/*` runtime dependency, see [`examples/raw-otel/`](../examples/raw-otel/).

## Stability and versioning

**Status: v0, pre-1.0, not yet stable.**

The attribute names below can change before MVP cutover. Once the API stabilizes, every shipped name will be locked and any further change recorded in the [CHANGELOG](#changelog) at the bottom of this document. Until then: pin the SDK version, or expect to update raw-OTel producers when the spec moves.

## Span name conventions

The BetterLog OTLP parser dispatches purely on span name prefix. Resource attributes are read for one fallback (see `service.name` below); everything else lives on the span itself.

| Span name prefix | Destination | Notes |
|---|---|---|
| `workflow:<name>` | `workflows` table (one row per span) | The root span of one workflow execution. |
| `step:<name>` | `steps` table (one row per span) | A unit of work inside the workflow. Stitched to its parent step via OTel `parentSpanId`. |
| anything else | silently skipped, counted in `skipped` | The API logs `"OTLP batch ingested ... skipped=N"` but does not reject the request. |

See [`apps/api/src/ingestion/otlp-parse.ts`](../apps/api/src/ingestion/otlp-parse.ts) lines 30–62 for the dispatch logic, and lines 64–101 / 104–149 for the workflow and step row constructors respectively.

The literal strings `workflow:` and `step:` are case-sensitive and have no trailing whitespace.

## Workflow span attributes

Set these on a span named `workflow:<name>`. The parser reads them in [`spanToWorkflow`](../apps/api/src/ingestion/otlp-parse.ts) (lines 64–102).

| Attribute | Type | Required | Maps to | Example |
|---|---|---|---|---|
| `betterlog.workflow.id` | string | **yes** | `workflows.id` (primary key, upsert key) | `"01HXYZAB7QK4N0M7G2GTRP1A0F"` (ulid recommended) |
| `betterlog.workflow.name` | string | **yes** | `workflows.name` | `"order.fulfillment"` |
| `betterlog.workflow.version` | string | no, defaults to `"0.0.0"` | `workflows.version` | `"1.2.0"` |
| `betterlog.workflow.environment` | string | no, defaults to `"development"` | `workflows.environment` | `"production"` |
| `betterlog.business.<key>` | string (one entry per business key) | zero or more | `workflows.business_keys` (JSONB) | key `betterlog.business.order_id` → `business_keys["order_id"] = "1234"` |
| `betterlog.workflow.metadata` | string, JSON-encoded object | no | `workflows.metadata` (JSONB) | `'{"source":"stripe-webhook"}'` |

A span missing either `betterlog.workflow.id` or `betterlog.workflow.name` is silently skipped (counted toward `skipped`). The parser does not log per-span.

### Business keys

`betterlog.business.<key>` is a prefix convention, not a single attribute. Every span attribute whose key starts with `betterlog.business.` and whose value is a string contributes one entry to the workflow's `business_keys` JSONB column. Non-string values (numbers, booleans, arrays) are ignored — store IDs as strings.

The `business_keys` column is GIN-indexed; query containment with `WHERE business_keys @> '{"order_id":"1234"}'`.

Recommended keys, per [`SPEC.md`](../SPEC.md) §3:

| Convention | Workflow type |
|---|---|
| `order_id` | E-commerce / fulfillment workflows. |
| `invoice_id` | Billing / accounting workflows. |
| `run_id` | Agent runs, batch jobs, scheduled syncs. |
| `customer_id` | Any workflow scoped to a known customer; useful as a secondary key alongside the primary one. |

Adding domain-specific keys (`shipment_id`, `subscription_id`) is fine and expected — these are conventions, not an exhaustive list.

### Workflow metadata

`betterlog.workflow.metadata` is a single string attribute whose value is expected to be a valid JSON object. The parser calls `JSON.parse` on it; if parsing fails the raw string is stored. The SDK's `withWorkflow` silently drops the metadata field if `JSON.stringify` throws (circular references, BigInts), which means **unserializable metadata disappears with no warning**. Sanitize on your end if it matters.

### Workflow status — derived, not declared

There is **no** `betterlog.workflow.status` attribute. The parser derives `workflows.status` from two OTel native fields ([lines 81–86](../apps/api/src/ingestion/otlp-parse.ts)):

| OTel `Span.endTimeUnixNano` | OTel `Span.Status.Code` | `workflows.status` |
|---|---|---|
| unset | any | `running` |
| set | `2` (ERROR) | `failed` |
| set | `1` (OK) | `success` |
| set | `0` (UNSET) or missing | `success` |

The OTel status code values (`1=OK`, `2=ERROR`) follow the OTLP wire spec — see [`apps/api/src/ingestion/otlp-types.ts`](../apps/api/src/ingestion/otlp-types.ts) for the schema. Setting `Span.Status.Code = OK` explicitly is recommended on success; the default (UNSET) is also accepted but loses the ability to distinguish "ended cleanly" from "ended without an outcome ever set".

## Step span attributes

Set these on a span named `step:<name>` whose parent in the trace is the workflow span (or another step span). The parser reads them in [`spanToStep`](../apps/api/src/ingestion/otlp-parse.ts) (lines 104–149).

| Attribute | Type | Required | Maps to | Example |
|---|---|---|---|---|
| `betterlog.workflow.id` | string | **yes** — this is what stitches the step to its workflow server-side | `steps.workflow_id` | `"01HXYZAB7QK4N0M7G2GTRP1A0F"` (same value as the parent workflow span) |
| `betterlog.workflow.name` | string | recommended (redundancy, debugging) | not stored on the step row | `"order.fulfillment"` |
| `betterlog.step.name` | string | recommended; falls back to the span name minus the `step:` prefix | `steps.name` | `"back40.push"` |
| `betterlog.step.service` | string | recommended; falls back to the resource `service.name`, then to `"unknown"` | `steps.service` | `"omniapi-services"` |
| `betterlog.step.status` | enum string: `started \| success \| failed \| skipped \| retrying` | no — derived from OTel status if absent (see below) | `steps.status` | `"failed"` |
| `betterlog.step.input` | string, JSON-encoded | no | `steps.input` (JSONB) | `'{"orderId":"1234","skus":["P-9821"]}'` |
| `betterlog.step.output` | string, JSON-encoded | no | `steps.output` (JSONB) | `'{"back40OrderId":"b40-1234"}'` |
| `betterlog.step.error` | string, JSON-encoded `{ message, code?, stack? }` | no — only meaningful when status is `failed` | `steps.error` (JSONB) | `'{"message":"SKU mapping missing","code":"SKU_MAPPING_MISSING"}'` |

A span missing `betterlog.workflow.id` is silently skipped. A span with that attribute but a blank step name (no `betterlog.step.name` attribute and a span named exactly `"step:"`) is also skipped.

### Step service fallback

If `betterlog.step.service` is not set on the span, the parser uses the resource-level `service.name` attribute from the OTLP `ResourceSpans` envelope ([line 132](../apps/api/src/ingestion/otlp-parse.ts)). If neither is present, `steps.service` is written as the literal string `"unknown"`. The SDK always sets `betterlog.step.service` explicitly because the per-step service often differs from the host process — a Node `ecom-middleware` service can record steps that logically belong to `back40` or `medusa`.

### Step status — auto-derived rules

If `betterlog.step.status` is set explicitly, that value wins. Otherwise the parser derives it ([lines 117–127](../apps/api/src/ingestion/otlp-parse.ts)) in this priority order:

| Condition | Resolved `steps.status` |
|---|---|
| `betterlog.step.status` attribute present | use the attribute value as-is (no validation against the enum — typos pass through) |
| OTel `Span.Status.Code = 2` (ERROR) | `failed` |
| OTel `Span.Status.Code = 1` (OK) | `success` |
| `endTimeUnixNano` is set, status code is UNSET/missing | `success` |
| `endTimeUnixNano` is not set | `started` |

The SDK's `recordStep` writes the attribute explicitly in both forms, so raw-OTel producers that want to be strict should do the same.

### Step error shape

The expected JSON shape stored on `betterlog.step.error` is:

```json
{ "message": "string, required", "code": "string, optional", "stack": "string, optional" }
```

Additional fields are stored as-is (the column is JSONB) but the diagnosis agent only reads `message`, `code`, and `stack`. When the step status resolves to `failed` and no `betterlog.step.error` attribute is present, the parser falls back to `{ message: span.status.message ?? "unknown error" }` ([lines 142–144](../apps/api/src/ingestion/otlp-parse.ts)). Always emit `betterlog.step.error` for failed steps — the fallback is cosmetic, not useful for diagnosis.

### Parent step stitching

`steps.parent_step_id` is taken directly from the OTel `Span.parentSpanId` field — not a `betterlog.*` attribute. As long as the producer maintains correct OTel span parentage (which `tracer.startActiveSpan` does automatically inside an existing active context), nested `recordStep`-equivalent calls land as child rows in `steps` without further annotation.

`steps.span_id` and `steps.id` are both set to OTel `Span.spanId`. This is intentional — the span id is the row's primary key, which gives us trivial idempotency on retransmits.

## Worked example: one OTLP/HTTP request

A single batch that produces one workflow row plus two step rows (one success, one failure). Abbreviated where unambiguous (`...` in IDs, ISO-equivalent timestamps shown alongside the wire nanosecond values).

```http
POST /v1/otlp/traces HTTP/1.1
Host: api.betterlog.example
Authorization: Bearer blg_dev_localonly
Content-Type: application/json
```

```json
{
  "resourceSpans": [{
    "resource": {
      "attributes": [
        { "key": "service.name",    "value": { "stringValue": "ecom-middleware" } },
        { "key": "service.version", "value": { "stringValue": "1.2.0" } }
      ]
    },
    "scopeSpans": [{
      "scope": { "name": "my-app", "version": "0.0.1" },
      "spans": [
        {
          "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
          "spanId":  "051581bf3cb55c13",
          "name":    "workflow:order.fulfillment",
          "startTimeUnixNano": "1748371200000000000",
          "endTimeUnixNano":   "1748371200750000000",
          "status": { "code": 2, "message": "SKU mapping missing for P-9821" },
          "attributes": [
            { "key": "betterlog.workflow.id",          "value": { "stringValue": "01HXYZAB7QK4N0M7G2GTRP1A0F" } },
            { "key": "betterlog.workflow.name",        "value": { "stringValue": "order.fulfillment" } },
            { "key": "betterlog.workflow.version",     "value": { "stringValue": "1.0.0" } },
            { "key": "betterlog.workflow.environment", "value": { "stringValue": "production" } },
            { "key": "betterlog.business.order_id",    "value": { "stringValue": "1234" } },
            { "key": "betterlog.business.customer_id", "value": { "stringValue": "c-99" } },
            { "key": "betterlog.workflow.metadata",    "value": { "stringValue": "{\"source\":\"stripe-webhook\"}" } }
          ]
        },
        {
          "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
          "spanId":  "a1b2c3d4e5f60718",
          "parentSpanId": "051581bf3cb55c13",
          "name":    "step:medusa.create_order",
          "startTimeUnixNano": "1748371200050000000",
          "endTimeUnixNano":   "1748371200120000000",
          "status": { "code": 1 },
          "attributes": [
            { "key": "betterlog.workflow.id",   "value": { "stringValue": "01HXYZAB7QK4N0M7G2GTRP1A0F" } },
            { "key": "betterlog.workflow.name", "value": { "stringValue": "order.fulfillment" } },
            { "key": "betterlog.step.name",     "value": { "stringValue": "medusa.create_order" } },
            { "key": "betterlog.step.service",  "value": { "stringValue": "ecom-middleware" } },
            { "key": "betterlog.step.status",   "value": { "stringValue": "success" } },
            { "key": "betterlog.step.input",    "value": { "stringValue": "{\"orderId\":\"1234\"}" } },
            { "key": "betterlog.step.output",   "value": { "stringValue": "{\"medusaOrderId\":\"1234\",\"status\":\"created\"}" } }
          ]
        },
        {
          "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
          "spanId":  "f1e2d3c4b5a69708",
          "parentSpanId": "051581bf3cb55c13",
          "name":    "step:back40.push",
          "startTimeUnixNano": "1748371200500000000",
          "endTimeUnixNano":   "1748371200720000000",
          "status": { "code": 2, "message": "SKU mapping missing for P-9821" },
          "attributes": [
            { "key": "betterlog.workflow.id",   "value": { "stringValue": "01HXYZAB7QK4N0M7G2GTRP1A0F" } },
            { "key": "betterlog.workflow.name", "value": { "stringValue": "order.fulfillment" } },
            { "key": "betterlog.step.name",     "value": { "stringValue": "back40.push" } },
            { "key": "betterlog.step.service",  "value": { "stringValue": "omniapi-services" } },
            { "key": "betterlog.step.status",   "value": { "stringValue": "failed" } },
            { "key": "betterlog.step.input",    "value": { "stringValue": "{\"sku\":\"P-9821\"}" } },
            { "key": "betterlog.step.error",    "value": { "stringValue": "{\"message\":\"SKU mapping missing for P-9821\",\"code\":\"SKU_MAPPING_MISSING\"}" } }
          ]
        }
      ]
    }]
  }]
}
```

Expected response: `200 OK` with body `{"partialSuccess":{}}`. The API logs one line:

```
OTLP batch ingested workflows=1 steps=2 skipped=0
```

## What the parser ignores

These are the silent-skip cases. The API does not reject the request or log per-span; it just increments `skipped` in the batch summary. Be aware:

- Spans whose name doesn't start with `workflow:` or `step:`. Free-form spans from your existing instrumentation pass through with no effect on BetterLog tables.
- `workflow:` spans missing `betterlog.workflow.id` or `betterlog.workflow.name`.
- `step:` spans missing `betterlog.workflow.id`. The most common cause is a `recordStep`-equivalent emitted outside an active workflow context.
- Step spans where `name` resolves to the empty string (no `betterlog.step.name` attribute and a span literally named `"step:"`).
- `betterlog.business.<key>` attribute values that aren't strings. Booleans, numbers, and arrays are dropped without warning.

The `events` table is in the database schema, and `betterlog.event.type` / `betterlog.outcome.*` constants are reserved in [`packages/shared/src/otel-attributes.ts`](../packages/shared/src/otel-attributes.ts), but **no producer or parser currently writes or reads them**. Do not emit `event:`-prefixed spans yet; they will be silently skipped. Event ingestion is on the post-MVP roadmap.

## Producing these spans without the SDK

A reference implementation that produces the same rows as the SDK-flavoured demo, but with no `@betterlog/*` runtime dependency, lives at [`examples/raw-otel/`](../examples/raw-otel/). It uses only `@opentelemetry/api`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/exporter-trace-otlp-http`, and a couple of helpers. About 130 lines of TypeScript end-to-end.

For Python, Go, Java, or any other OTel ecosystem: configure a tracer provider that exports OTLP/HTTP to `${BETTERLOG_API_URL}/v1/otlp/traces` with the header `Authorization: Bearer ${BETTERLOG_API_KEY}`, then emit spans named `workflow:<name>` and `step:<name>` with the attributes documented above. The API does not parse OTLP gRPC or OTLP/protobuf yet — only OTLP/HTTP JSON.

## CHANGELOG

- **v0** — initial draft, not yet stable.
