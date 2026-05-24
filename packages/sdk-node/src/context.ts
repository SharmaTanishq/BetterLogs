/**
 * Workflow context propagation.
 *
 * withWorkflow stores the active workflow's id/name in OTel context so that
 * any recordStep call inside the wrapped function — even across async
 * boundaries — can tag its span with `betterlog.workflow.id`. That way the
 * server-side OTLP receiver can attribute steps to workflows without walking
 * the span tree.
 */

import { context, createContextKey, type Context } from "@opentelemetry/api";

export interface WorkflowFrame {
  id: string;
  name: string;
  version: string;
  environment: string;
}

const WORKFLOW_FRAME_KEY = createContextKey("betterlog.workflow");

export function getActiveWorkflow(): WorkflowFrame | undefined {
  return context.active().getValue(WORKFLOW_FRAME_KEY) as WorkflowFrame | undefined;
}

export function withActiveWorkflow<T>(frame: WorkflowFrame, fn: () => T): T {
  const ctx: Context = context.active().setValue(WORKFLOW_FRAME_KEY, frame);
  return context.with(ctx, fn);
}
