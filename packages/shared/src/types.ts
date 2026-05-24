/**
 * Canonical types for BetterLog's data model.
 *
 * Source of truth: SPEC.md §3. Any change here must be reflected in the spec
 * (and vice versa) before it lands.
 */

export type WorkflowStatus =
  | "running"
  | "success"
  | "failed"
  | "timeout"
  | "escalated"
  | "cancelled";

export type TerminalWorkflowStatus = Exclude<WorkflowStatus, "running">;

export type StepStatus = "started" | "success" | "failed" | "skipped" | "retrying";

export interface Workflow {
  id: string;
  name: string;
  version: string;
  environment: string;
  business_keys: Record<string, string>;
  status: WorkflowStatus;
  started_at: string;
  ended_at?: string;
  trace_id: string;
  metadata?: Record<string, unknown>;
}

export interface Step {
  id: string;
  workflow_id: string;
  name: string;
  service: string;
  status: StepStatus;
  started_at: string;
  ended_at?: string;
  input?: unknown;
  output?: unknown;
  error?: { message: string; code?: string; stack?: string };
  span_id: string;
  parent_step_id?: string;
}

export interface Event {
  id: string;
  workflow_id: string;
  step_id?: string;
  type: string;
  service: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface Outcome {
  workflow_id: string;
  status: TerminalWorkflowStatus;
  reason_code?: string;
  reason_text?: string;
  remediation_taken?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface FailureEmbedding {
  workflow_id: string;
  embedding: number[];
  summary: string;
}
