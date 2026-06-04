# Cross-service propagation contract

BetterLog propagates workflow context across HTTP boundaries using standard OpenTelemetry W3C headers.

## Headers

| Header | Purpose |
|--------|---------|
| `traceparent` | W3C trace context — links parent/child spans across services |
| `tracestate` | Optional vendor trace state |
| `baggage` | W3C baggage — carries BetterLog workflow metadata |

## Baggage keys

All keys mirror span attributes in `@betterlog/shared` (`OTEL_ATTR`):

| Baggage key | Example | Required |
|-------------|---------|----------|
| `betterlog.workflow.id` | `01JABC...` | yes |
| `betterlog.workflow.name` | `order.fulfillment` | yes |
| `betterlog.workflow.version` | `1.0.0` | no (default `0.0.0`) |
| `betterlog.workflow.environment` | `production` | no (default `development`) |
| `betterlog.business.<key>` | `betterlog.business.order_id=1234` | no |

## Local vs remote workflows

- **Local**: `withWorkflow()` opens a `workflow:*` span and sets baggage. Steps buffer until the workflow span ends (see `WorkflowAwareSpanProcessor`).
- **Remote**: A downstream service receives inbound baggage via `runWithIncomingContext()`. The workflow id is registered as *remote* so step spans export immediately (the workflow row already exists upstream).

## SDK helpers

Node (`@betterlog/sdk-node`):

- `injectPropagationHeaders(headers)` — outbound HTTP
- `runWithIncomingContext(headers, fn)` — inbound HTTP

Nest (`@betterlog/sdk-nestjs`):

- `WorkflowContextInterceptor` — auto rehydrates remote workflows on every request
- `BetterLogHttpService` — wraps fetch/axios with propagation headers

Browser (`@betterlog/sdk-browser`):

- `betterLogInterceptor` — Angular `HttpInterceptor` injecting trace + baggage

## Browser API keys

Browsers must NOT use the workspace secret `BETTERLOG_API_KEY`. Use a separate **publishable ingest key** (`BETTERLOG_PUBLISHABLE_API_KEY`) scoped to OTLP ingestion only. See `docs/neon-setup.md` for env configuration.
