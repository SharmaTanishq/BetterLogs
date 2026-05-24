/**
 * Compose the deterministic text representation that gets embedded for a
 * failed workflow. The same text is stored in `failure_embeddings.summary`
 * so the diagnose agent can read it directly when find_similar_failures
 * returns a hit (no separate join needed to recover what the row "means").
 *
 * Format is intentionally line-oriented + low-cardinality so two failures
 * with the same shape (same step + same error code) produce near-identical
 * embeddings; cosine distance does the rest.
 */

import type { StepRow, WorkflowRow } from "../db/schema.js";

export function composeEmbedText(workflow: WorkflowRow, failedStep: StepRow | null): string {
  const businessKeys = formatBusinessKeys(workflow.businessKeys);

  let failedStepLine: string;
  let errorLine: string;
  let errorCodeLine: string;

  if (failedStep) {
    failedStepLine = `failed_step: ${failedStep.name} (service: ${failedStep.service})`;
    const err = failedStep.error;
    errorLine = `error: ${err?.message ?? "(no error message recorded)"}`;
    errorCodeLine = `error_code: ${err?.code ?? "(none)"}`;
  } else {
    failedStepLine = "failed_step: (no failed step recorded — workflow marked failed without a step error)";
    errorLine = "error: (none)";
    errorCodeLine = "error_code: (none)";
  }

  return [
    `workflow: ${workflow.name} v${workflow.version}`,
    `environment: ${workflow.environment}`,
    `business_keys: ${businessKeys}`,
    failedStepLine,
    errorLine,
    errorCodeLine,
  ].join("\n");
}

function formatBusinessKeys(keys: Record<string, string>): string {
  const entries = Object.entries(keys);
  if (entries.length === 0) return "(none)";
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}
