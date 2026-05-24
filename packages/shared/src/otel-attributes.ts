/**
 * OpenTelemetry span attribute names BetterLog reads off incoming spans.
 *
 * Mirrors the table in SPEC.md §3 "OpenTelemetry mapping". Customers either
 * use our SDK (which sets these for them) or set them manually on their
 * existing OTel spans.
 */

export const OTEL_ATTR = {
  workflowId: "betterlog.workflow.id",
  workflowName: "betterlog.workflow.name",
  workflowVersion: "betterlog.workflow.version",
  workflowEnvironment: "betterlog.workflow.environment",

  /** Prefix; full keys are `betterlog.business.<key>` per workflow business key. */
  businessPrefix: "betterlog.business.",

  stepName: "betterlog.step.name",
  stepStatus: "betterlog.step.status",
  stepService: "betterlog.step.service",

  eventType: "betterlog.event.type",

  outcomeStatus: "betterlog.outcome.status",
  outcomeReason: "betterlog.outcome.reason",
  outcomeReasonText: "betterlog.outcome.reason_text",
} as const;

export type OtelAttrKey = (typeof OTEL_ATTR)[keyof typeof OTEL_ATTR];
