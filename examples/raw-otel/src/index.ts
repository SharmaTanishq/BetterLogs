/**
 * Raw-OTel reference implementation.
 *
 * Same scenario as examples/wilco-order-demo (one order.fulfillment workflow
 * with three steps: medusa.create_order -> queue.published -> back40.push).
 * Same `workflows` + `steps` rows show up in Postgres. The only difference:
 * this file has zero `@betterlog/*` runtime imports. Everything is vanilla
 * `@opentelemetry/*` plus the documented attribute names from
 * docs/otel-semantic-conventions.md.
 *
 * The point is to make the wire-level contract auditable. If you don't trust
 * `@betterlog/sdk-node` (or you're shipping a Python / Go equivalent), this
 * is what your producer needs to do — about 130 lines of TypeScript.
 *
 * Run with:
 *   pnpm --filter @betterlog/example-raw-otel start
 *   FAIL_AT=back40 pnpm --filter @betterlog/example-raw-otel start
 */

import { SpanStatusCode, trace, type Span, type Tracer } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { ulid } from "ulid";

const SERVICE_NAME = "raw-otel-demo";
const SERVICE_VERSION = "0.0.1";
const TRACER_NAME = "examples/raw-otel";

async function main(): Promise<void> {
  const apiUrl = process.env.BETTERLOG_API_URL;
  const apiKey = process.env.BETTERLOG_API_KEY;
  if (!apiUrl) throw new Error("BETTERLOG_API_URL missing");
  if (!apiKey) throw new Error("BETTERLOG_API_KEY missing");

  // Mirror of packages/sdk-node/src/otel.ts — what init() would have done.
  const exporter = new OTLPTraceExporter({
    url: `${apiUrl.replace(/\/$/, "")}/v1/otlp/traces`,
    headers: { authorization: `Bearer ${apiKey}` },
  });
  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });
  provider.register();
  const tracer = trace.getTracer(TRACER_NAME, "0.0.0");

  const orderId = `demo-${Math.floor(Math.random() * 10_000)}`;
  const order = makeOrder(orderId);
  const failAt = process.env.FAIL_AT;

  try {
    await runWorkflow(tracer, orderId, order, failAt);
  } finally {
    // Without this the BatchSpanProcessor may exit before flushing the last batch.
    await provider.shutdown();
  }
}

async function runWorkflow(
  tracer: Tracer,
  orderId: string,
  order: Order,
  failAt: string | undefined,
): Promise<void> {
  const workflowId = ulid();

  // Root span: workflow:<name>. The attribute set here is exactly what
  // withWorkflow emits — see packages/sdk-node/src/withWorkflow.ts.
  await tracer.startActiveSpan(
    "workflow:order.fulfillment",
    {
      attributes: {
        "betterlog.workflow.id": workflowId,
        "betterlog.workflow.name": "order.fulfillment",
        "betterlog.workflow.version": "1.0.0",
        "betterlog.workflow.environment": "development",
        "betterlog.business.order_id": orderId,
        "betterlog.business.order_value_cents": String(order.totalCents),
        "betterlog.business.customer_id": order.customer.id,
        "betterlog.workflow.metadata": JSON.stringify({ source: "raw-otel" }),
      },
    },
    async (workflowSpan) => {
      console.log(`Starting raw-otel workflow ${workflowId} for order ${orderId}`);
      try {
        await recordStep(
          tracer,
          { workflowId, name: "medusa.create_order", service: "ecom-middleware", input: order },
          async () => {
            await sleep(50);
            return { medusaOrderId: orderId, status: "created", order };
          },
        );

        await recordStep(
          tracer,
          {
            workflowId,
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
          tracer,
          { workflowId, name: "back40.push", service: "omniapi-services", input: order },
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

        workflowSpan.setStatus({ code: SpanStatusCode.OK });
        console.log("raw-otel workflow finished.");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        workflowSpan.recordException(err instanceof Error ? err : new Error(message));
        workflowSpan.setStatus({ code: SpanStatusCode.ERROR, message });
        throw err;
      } finally {
        workflowSpan.end();
      }
    },
  );
}

/**
 * The recordStep equivalent — opens a `step:<name>` child of the active
 * workflow span, sets the documented betterlog.step.* attributes, derives
 * success/failed from whether the function throws. Mirrors the wire format
 * of packages/sdk-node/src/recordStep.ts. ~25 lines of real work.
 */
async function recordStep<T>(
  tracer: Tracer,
  opts: { workflowId: string; name: string; service: string; input?: unknown },
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(
    `step:${opts.name}`,
    {
      attributes: {
        "betterlog.workflow.id": opts.workflowId,
        "betterlog.workflow.name": "order.fulfillment",
        "betterlog.step.name": opts.name,
        "betterlog.step.service": opts.service,
        "betterlog.step.status": "started",
      },
    },
    async (span: Span) => {
      if (opts.input !== undefined) {
        span.setAttribute("betterlog.step.input", safeJson(opts.input));
      }
      try {
        const result = await fn();
        span.setAttribute("betterlog.step.status", "success");
        if (result !== undefined) {
          span.setAttribute("betterlog.step.output", safeJson(result));
        }
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.setAttribute("betterlog.step.status", "failed");
        const payload = serializeError(err);
        span.setAttribute("betterlog.step.error", safeJson(payload));
        span.recordException(err instanceof Error ? err : new Error(payload.message));
        span.setStatus({ code: SpanStatusCode.ERROR, message: payload.message });
        throw err;
      } finally {
        span.end();
      }
    },
  );
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function serializeError(err: unknown): { message: string; name?: string; code?: string; stack?: string } {
  if (err instanceof Error) {
    const out: Record<string, unknown> = { name: err.name, message: err.message, stack: err.stack };
    for (const key of Object.getOwnPropertyNames(err)) {
      if (key in out) continue;
      out[key] = (err as unknown as Record<string, unknown>)[key];
    }
    return out as { message: string };
  }
  return { message: String(err) };
}

function makeOrder(orderId: string): Order {
  return {
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
