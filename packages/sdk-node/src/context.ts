/**
 * Workflow context propagation.
 *
 * withWorkflow stores the active workflow's id/name in OTel context so that
 * any recordStep call inside the wrapped function — even across async
 * boundaries — can tag its span with `betterlog.workflow.id`. That way the
 * server-side OTLP receiver can attribute steps to workflows without walking
 * the span tree.
 *
 * Remote workflows (rehydrated from inbound W3C baggage on a downstream
 * service) are registered so WorkflowAwareSpanProcessor forwards their
 * step spans immediately instead of buffering forever.
 */

import { context, createContextKey, type Context } from "@opentelemetry/api";

export interface WorkflowFrame {
  id: string;
  name: string;
  version: string;
  environment: string;
  /** True when this frame was rehydrated from inbound baggage (no local workflow span). */
  remote?: boolean;
  businessKeys?: Record<string, string>;
}

const WORKFLOW_FRAME_KEY = createContextKey("betterlog.workflow");

/** Workflow ids started remotely — steps must not wait for a local workflow:* span. */
const remoteWorkflowIds = new Set<string>();

export function getActiveWorkflow(): WorkflowFrame | undefined {
  return context.active().getValue(WORKFLOW_FRAME_KEY) as WorkflowFrame | undefined;
}

export function withActiveWorkflow<T>(frame: WorkflowFrame, fn: () => T): T {
  const ctx: Context = context.active().setValue(WORKFLOW_FRAME_KEY, frame);
  return context.with(ctx, fn);
}

export function withActiveWorkflowOnContext<T>(
  ctx: Context,
  frame: WorkflowFrame,
  fn: () => T,
): T {
  const next = ctx.setValue(WORKFLOW_FRAME_KEY, frame);
  return context.with(next, fn);
}

export function registerRemoteWorkflow(workflowId: string): void {
  remoteWorkflowIds.add(workflowId);
}

export function isRemoteWorkflow(workflowId: string): boolean {
  return remoteWorkflowIds.has(workflowId);
}

export function clearRemoteWorkflow(workflowId: string): void {
  remoteWorkflowIds.delete(workflowId);
}
