/**
 * Tiny demo that exercises the BetterLog SDK end-to-end.
 *
 * Run with `pnpm --filter @betterlog/example-wilco-order-demo start`.
 *
 * Simulates a single Wilco order moving through three boundaries:
 *   medusa.create_order -> queue.published -> back40.push
 *
 * One run produces one `workflows` row + three `steps` rows in Postgres.
 * Run with FAIL_AT=back40 to also exercise the failure path.
 */

import { init, recordStep, shutdown, withWorkflow } from "@betterlog/sdk-node";

async function main(): Promise<void> {
  init({
    serviceName: "wilco-order-demo",
    serviceVersion: "0.0.1",
  });

  const orderId = `demo-${Math.floor(Math.random() * 10_000)}`;
  const failAt = process.env.FAIL_AT;

  const order = {
    id: orderId,
    customer: {
      id: "c-99",
      name: "Jane Doe",
      email: "jane@example.com",
      address: { street: "1 Test Way", city: "Springfield", zip: "00000" },
    },
    lineItems: [
      { sku: "P-9821", qty: 2, priceCents: 2500 },
      { sku: "P-7432", qty: 1, priceCents: 3900 },
    ],
    totalCents: 8900,
    currency: "USD",
    payment: { method: "card", token: "tok_xyz", last4: "4242" },
    createdAt: new Date().toISOString(),
  };

  try {
    await runWorkflow(orderId, order, failAt);
  } finally {
    // Flush spans even when the workflow throws.
    await shutdown();
  }
}

async function runWorkflow(
  orderId: string,
  order: Order,
  failAt: string | undefined,
): Promise<void> {
  await withWorkflow(
    {
      name: "order.fulfillment",
      version: "1.0.0",
      environment: "development",
      businessKeys: {
        order_id: orderId,
        order_value_cents: String(order.totalCents),
        customer_id: order.customer.id,
      },
      metadata: { source: "wilco-order-demo" },
    },
    async ({ workflowId }) => {
      console.log(`Starting demo workflow ${workflowId} for order ${orderId}`);

      await recordStep(
        { name: "medusa.create_order", service: "ecom-middleware", input: order },
        async () => {
          await sleep(50);
          return { medusaOrderId: orderId, status: "created", order };
        },
      );

      await recordStep(
        {
          name: "queue.published",
          service: "ecom-middleware",
          input: { queue: "omniapi-tasks", payload: order },
        },
        async () => {
          await sleep(20);
          return { messageId: `msg-${orderId}`, queue: "omniapi-tasks" };
        },
      );

      await recordStep(
        { name: "back40.push", service: "omniapi-services", input: order },
        async () => {
          await sleep(80);
          if (failAt === "back40") {
            throw new BackFortyError(
              "SKU mapping missing for P-9821",
              "SKU_MAPPING_MISSING",
              { sku: "P-9821", attemptedAt: new Date().toISOString() },
            );
          }
          return { back40OrderId: `b40-${orderId}`, confirmedAt: new Date().toISOString() };
        },
      );

      console.log("Demo workflow finished.");
    },
  );
}

type Order = {
  id: string;
  customer: { id: string; name: string; email: string; address: Record<string, string> };
  lineItems: Array<{ sku: string; qty: number; priceCents: number }>;
  totalCents: number;
  currency: string;
  payment: { method: string; token: string; last4: string };
  createdAt: string;
};

class BackFortyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: Record<string, unknown>,
  ) {
    super(message);
    this.name = "BackFortyError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
