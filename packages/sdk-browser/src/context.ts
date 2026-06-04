import { context, createContextKey, type Context } from "@opentelemetry/api";

export interface WorkflowFrame {
  id: string;
  name: string;
  version: string;
  environment: string;
  remote?: boolean;
  businessKeys?: Record<string, string>;
}

const WORKFLOW_FRAME_KEY = createContextKey("betterlog.workflow");
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
