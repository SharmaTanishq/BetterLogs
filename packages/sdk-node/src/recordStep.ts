/**
 * recordStep — the second SDK primitive.
 *
 *   await recordStep(
 *     { name: "back40.push", service: "omniapi-services", status: "started" },
 *     async () => back40Client.push(order),
 *   );
 *
 * Two forms:
 *
 *  - With a function: opens a span around the call, marks it success/failed
 *    based on whether the function threw.
 *  - Without a function: records a single-shot event (e.g. status="success"
 *    for a one-off boundary you don't wrap).
 *
 * In both cases, the resulting span is a child of the surrounding workflow
 * span (set up by withWorkflow), so steps roll up correctly server-side.
 *
 * `input` and `output` are stored as raw JSON on the span — pass the whole
 * payload, the LLM needs everything to diagnose.
 */

import { SpanStatusCode } from "@opentelemetry/api";
import type { StepStatus } from "@betterlog/shared";
import { OTEL_ATTR } from "@betterlog/shared";
import { getActiveWorkflow } from "./context.js";
import { getTracer } from "./otel.js";

export interface RecordStepOptions {
  name: string;
  service: string;
  status?: StepStatus;
  input?: unknown;
  output?: unknown;
}

export async function recordStep<T>(
  opts: RecordStepOptions & { status?: StepStatus },
  fn: () => Promise<T>,
): Promise<T>;
export function recordStep(opts: RecordStepOptions & { status: StepStatus }): void;
export function recordStep<T>(
  opts: RecordStepOptions,
  fn?: () => Promise<T>,
): Promise<T> | void {
  const tracer = getTracer();
  const attributes: Record<string, string> = {
    [OTEL_ATTR.stepName]: opts.name,
    [OTEL_ATTR.stepService]: opts.service,
  };
  const workflow = getActiveWorkflow();
  if (workflow) {
    attributes[OTEL_ATTR.workflowId] = workflow.id;
    attributes[OTEL_ATTR.workflowName] = workflow.name;
    if (workflow.businessKeys) {
      for (const [key, value] of Object.entries(workflow.businessKeys)) {
        attributes[`${OTEL_ATTR.businessPrefix}${key}`] = value;
      }
    }
  }

  if (!fn) {
    if (!opts.status) {
      throw new Error("recordStep: status required when no function is provided");
    }
    attributes[OTEL_ATTR.stepStatus] = opts.status;
    const span = tracer.startSpan(`step:${opts.name}`, { attributes });
    if (opts.input !== undefined) span.setAttribute("betterlog.step.input", safeJson(opts.input));
    if (opts.output !== undefined)
      span.setAttribute("betterlog.step.output", safeJson(opts.output));
    span.end();
    return;
  }

  attributes[OTEL_ATTR.stepStatus] = opts.status ?? "started";
  return tracer.startActiveSpan(`step:${opts.name}`, { attributes }, async (span) => {
    if (opts.input !== undefined) span.setAttribute("betterlog.step.input", safeJson(opts.input));
    try {
      const result = await fn();
      span.setAttribute(OTEL_ATTR.stepStatus, "success");
      if (result !== undefined) span.setAttribute("betterlog.step.output", safeJson(result));
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setAttribute(OTEL_ATTR.stepStatus, "failed");
      const errPayload = serializeError(err);
      span.setAttribute("betterlog.step.error", safeJson(errPayload));
      span.recordException(err instanceof Error ? err : new Error(errPayload.message));
      span.setStatus({ code: SpanStatusCode.ERROR, message: errPayload.message });
      throw err;
    } finally {
      span.end();
    }
  });
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function serializeError(err: unknown): {
  message: string;
  name?: string;
  code?: string;
  stack?: string;
  cause?: unknown;
  [k: string]: unknown;
} {
  if (err instanceof Error) {
    const out: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    for (const key of Object.getOwnPropertyNames(err)) {
      if (key in out) continue;
      out[key] = (err as unknown as Record<string, unknown>)[key];
    }
    return out as { message: string };
  }
  return { message: String(err) };
}
