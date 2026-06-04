import { describe, expect, it } from "vitest";
import { context, propagation, trace, SpanStatusCode } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { OTEL_ATTR } from "@betterlog/shared";
import {
  attachWorkflowBaggage,
  extractWorkflowFrameFromContext,
  injectPropagationHeaders,
  runWithIncomingContext,
} from "./baggage.js";
import { getActiveWorkflow, isRemoteWorkflow, registerRemoteWorkflow } from "./context.js";

describe("baggage propagation", () => {
  it("round-trips workflow frame through HTTP headers", () => {
    const provider = new NodeTracerProvider();
    provider.register({
      propagator: new CompositePropagator({
        propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
      }),
    });
    const tracer = trace.getTracer("test");

    tracer.startActiveSpan("upstream", () => {
      const frame = {
        id: "wf-123",
        name: "order.fulfillment",
        version: "1.0.0",
        environment: "test",
        businessKeys: { order_id: "9999" },
      };
      const ctx = attachWorkflowBaggage(context.active(), frame);

      context.with(ctx, () => {
        const headers = injectPropagationHeaders({});

        runWithIncomingContext(headers, () => {
          const active = getActiveWorkflow();
          expect(active?.id).toBe("wf-123");
          expect(active?.name).toBe("order.fulfillment");
          expect(active?.remote).toBe(true);
          expect(active?.businessKeys?.order_id).toBe("9999");
          expect(isRemoteWorkflow("wf-123")).toBe(true);
        });
      });
    });

    provider.shutdown();
  });

  it("extracts workflow frame from baggage context", () => {
    let bag = propagation.createBaggage();
    bag = bag.setEntry(OTEL_ATTR.workflowId, { value: "abc" });
    bag = bag.setEntry(OTEL_ATTR.workflowName, { value: "test.flow" });
    const ctx = propagation.setBaggage(context.active(), bag);
    const frame = extractWorkflowFrameFromContext(ctx);
    expect(frame?.id).toBe("abc");
    expect(frame?.name).toBe("test.flow");
  });
});
