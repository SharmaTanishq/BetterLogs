import { context, propagation, type Context } from "@opentelemetry/api";
import { OTEL_ATTR } from "@betterlog/shared";
import { getActiveWorkflow, type WorkflowFrame } from "./context.js";

export function attachWorkflowBaggage(ctx: Context, frame: WorkflowFrame): Context {
  let bag = propagation.getBaggage(ctx) ?? propagation.createBaggage();
  bag = bag.setEntry(OTEL_ATTR.workflowId, { value: frame.id });
  bag = bag.setEntry(OTEL_ATTR.workflowName, { value: frame.name });
  bag = bag.setEntry(OTEL_ATTR.workflowVersion, { value: frame.version });
  bag = bag.setEntry(OTEL_ATTR.workflowEnvironment, { value: frame.environment });
  if (frame.businessKeys) {
    for (const [key, value] of Object.entries(frame.businessKeys)) {
      bag = bag.setEntry(`${OTEL_ATTR.businessPrefix}${key}`, { value });
    }
  }
  return propagation.setBaggage(ctx, bag);
}

export function injectPropagationHeaders(
  headers: Record<string, string> = {},
): Record<string, string> {
  const carrier: Record<string, string> = { ...headers };
  propagation.inject(context.active(), carrier);

  const frame = getActiveWorkflow();
  if (frame) {
    const ctx = attachWorkflowBaggage(context.active(), frame);
    propagation.inject(ctx, carrier);
  }

  return carrier;
}
