import { context, SpanStatusCode } from "@opentelemetry/api";
import { ulid } from "ulid";
import { OTEL_ATTR } from "@betterlog/shared";
import { attachWorkflowBaggage } from "./baggage.js";
import { withActiveWorkflow, type WorkflowFrame } from "./context.js";
import { getTracer } from "./otel.js";

export interface WithWorkflowOptions {
  name: string;
  businessKeys: Record<string, string>;
  workflowId?: string;
  version?: string;
  environment?: string;
  metadata?: Record<string, unknown>;
}

export async function withWorkflow<T>(
  opts: WithWorkflowOptions,
  fn: (ctx: { workflowId: string }) => Promise<T>,
): Promise<T> {
  const workflowId = opts.workflowId ?? ulid();
  const environment = opts.environment ?? "development";
  const version = opts.version ?? "0.0.0";

  const attributes: Record<string, string> = {
    [OTEL_ATTR.workflowId]: workflowId,
    [OTEL_ATTR.workflowName]: opts.name,
    [OTEL_ATTR.workflowVersion]: version,
    [OTEL_ATTR.workflowEnvironment]: environment,
  };
  for (const [key, value] of Object.entries(opts.businessKeys)) {
    attributes[`${OTEL_ATTR.businessPrefix}${key}`] = value;
  }
  if (opts.metadata !== undefined) {
    try {
      attributes["betterlog.workflow.metadata"] = JSON.stringify(opts.metadata);
    } catch {
      // ignore
    }
  }

  const frame: WorkflowFrame = {
    id: workflowId,
    name: opts.name,
    version,
    environment,
    remote: false,
    businessKeys: opts.businessKeys,
  };

  const tracer = getTracer();
  return withActiveWorkflow(frame, () => {
    const ctxWithBaggage = attachWorkflowBaggage(context.active(), frame);
    return context.with(ctxWithBaggage, () =>
      tracer.startActiveSpan(`workflow:${opts.name}`, { attributes }, async (span) => {
        try {
          const result = await fn({ workflowId });
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          span.recordException(err instanceof Error ? err : new Error(message));
          span.setStatus({ code: SpanStatusCode.ERROR, message });
          throw err;
        } finally {
          span.end();
        }
      }),
    );
  });
}
