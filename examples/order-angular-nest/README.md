# Order Angular + Nest cross-service demo

Validates BetterLog cross-service workflow tracing:

1. **Angular web** (`storefront`) — starts `order.fulfillment` on button click, records `checkout.click`, calls gateway with W3C trace + baggage.
2. **Nest gateway** (`order-gateway`) — continues workflow, records `gateway.validate`, calls inventory with propagation.
3. **Nest inventory** (`inventory-service`) — remote workflow rehydrated from headers, records `inventory.reserve`.

## Prerequisites

- BetterLog API running (`pnpm --filter @betterlog/api dev`)
- Postgres / Neon with migrations applied
- Root `.env` with `BETTERLOG_API_URL`, `BETTERLOG_API_KEY`, `BETTERLOG_PUBLISHABLE_API_KEY`

## Run

```bash
# Terminal 1 — API
pnpm --filter @betterlog/api dev

# Terminal 2 — demo stack
pnpm --filter @betterlog/example-order-angular-nest start
```

Open http://localhost:4200, click **Create order**, then search the generated `order_id` at http://localhost:3030/app/workflows.

## Failure path

Set `FAIL_AT=inventory` or use sku `BAD-SKU` in the request body to simulate inventory failure.
