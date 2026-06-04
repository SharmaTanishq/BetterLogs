/**
 * W3C baggage propagation for cross-service workflow context.
 *
 * Workflow id, name, version, environment, and business keys travel as OTel
 * baggage entries alongside traceparent. See docs/propagation-contract.md.
 */

import { context, propagation, type Context } from "@opentelemetry/api";
import { OTEL_ATTR } from "@betterlog/shared";
import {
  getActiveWorkflow,
  registerRemoteWorkflow,
  type WorkflowFrame,
  withActiveWorkflowOnContext,
} from "./context.js";

export type HttpHeadersCarrier = Record<string, string | string[] | undefined>;

function headerValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/** Normalize Node/Fastify-style headers into a string carrier for OTel extract/inject. */
export function toPropagationCarrier(headers: HttpHeadersCarrier): Record<string, string> {
  const carrier: Record<string, string> = {};
  for (const [key, raw] of Object.entries(headers)) {
    const value = headerValue(raw);
    if (value !== undefined) carrier[key.toLowerCase()] = value;
  }
  return carrier;
}

/** Attach the active workflow frame to OTel baggage on the given context. */
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

/** Read a WorkflowFrame from baggage on a context (does not mutate remote registry). */
export function extractWorkflowFrameFromContext(ctx: Context): WorkflowFrame | undefined {
  const bag = propagation.getBaggage(ctx);
  if (!bag) return undefined;

  const id = bag.getEntry(OTEL_ATTR.workflowId)?.value;
  const name = bag.getEntry(OTEL_ATTR.workflowName)?.value;
  if (!id || !name) return undefined;

  const businessKeys: Record<string, string> = {};
  for (const [key, entry] of bag.getAllEntries()) {
    if (key.startsWith(OTEL_ATTR.businessPrefix)) {
      businessKeys[key.slice(OTEL_ATTR.businessPrefix.length)] = entry.value;
    }
  }

  return {
    id,
    name,
    version: bag.getEntry(OTEL_ATTR.workflowVersion)?.value ?? "0.0.0",
    environment: bag.getEntry(OTEL_ATTR.workflowEnvironment)?.value ?? "development",
    businessKeys: Object.keys(businessKeys).length > 0 ? businessKeys : undefined,
  };
}

/**
 * Extract trace + baggage from inbound HTTP headers and run `fn` under that
 * context. When a remote workflow is present, registers it for immediate step export.
 */
export function runWithIncomingContext<T>(headers: HttpHeadersCarrier, fn: () => T): T {
  const carrier = toPropagationCarrier(headers);
  let extracted = propagation.extract(context.active(), carrier);
  const frame = extractWorkflowFrameFromContext(extracted);

  if (frame) {
    registerRemoteWorkflow(frame.id);
    const remoteFrame: WorkflowFrame = { ...frame, remote: true };
    extracted = attachWorkflowBaggage(extracted, remoteFrame);
    return withActiveWorkflowOnContext(extracted, remoteFrame, fn);
  }

  return context.with(extracted, fn);
}

/** Inject traceparent + baggage from the active context into outbound headers. */
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
