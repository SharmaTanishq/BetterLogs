/**
 * Translate an OTLP/HTTP trace export request into our domain rows.
 *
 * Each span is classified by its name prefix:
 *   - `workflow:*` → workflows row (root span)
 *   - `step:*`     → steps row     (child span)
 *
 * Anything else is currently ignored. (Free-form events from the SDK can
 * be added later — `events` table is in the schema but not yet ingested.)
 */

import type {
  NewStepRow,
  NewWorkflowRow,
} from "../db/schema.js";
import { OTEL_ATTR } from "@betterlog/shared";
import type {
  StepStatus,
  WorkflowStatus,
} from "@betterlog/shared";
import type { ExportTraceRequest, OtlpKeyValue, OtlpSpan } from "./otlp-types.js";

export interface ParsedBatch {
  workflows: NewWorkflowRow[];
  steps: NewStepRow[];
  /** Spans we saw but didn't know how to interpret. */
  skipped: number;
}

const WORKFLOW_PREFIX = "workflow:";
const STEP_PREFIX = "step:";
const STATUS_OK = 1;
const STATUS_ERROR = 2;

export function parseExport(req: ExportTraceRequest): ParsedBatch {
  const out: ParsedBatch = { workflows: [], steps: [], skipped: 0 };
  const workflowIds = new Set<string>();

  for (const rs of req.resourceSpans ?? []) {
    const resourceAttrs = attrsToMap(rs.resource?.attributes);
    const defaultService = stringAttr(resourceAttrs, "service.name") ?? "unknown";

    for (const ss of rs.scopeSpans ?? []) {
      for (const span of ss.spans ?? []) {
        const attrs = attrsToMap(span.attributes);

        if (span.name.startsWith(WORKFLOW_PREFIX)) {
          const row = spanToWorkflow(span, attrs);
          if (row) {
            out.workflows.push(row);
            workflowIds.add(row.id);
          } else out.skipped += 1;
        } else if (span.name.startsWith(STEP_PREFIX)) {
          const row = spanToStep(span, attrs, defaultService);
          if (row) {
            out.steps.push(row);
            if (!workflowIds.has(row.workflowId)) {
              const stub = stubWorkflowFromStepAttrs(span, attrs, row.workflowId);
              if (stub) {
                out.workflows.push(stub);
                workflowIds.add(stub.id);
              }
            }
          } else out.skipped += 1;
        } else {
          out.skipped += 1;
        }
      }
    }
  }

  return out;
}

/** When downstream services ship steps before the root workflow span, stub a row from step attrs. */
function stubWorkflowFromStepAttrs(
  span: OtlpSpan,
  attrs: Map<string, unknown>,
  workflowId: string,
): NewWorkflowRow | null {
  const name = stringAttr(attrs, OTEL_ATTR.workflowName);
  if (!name) return null;

  const businessKeys: Record<string, string> = {};
  for (const [key, value] of attrs) {
    if (key.startsWith(OTEL_ATTR.businessPrefix) && typeof value === "string") {
      businessKeys[key.slice(OTEL_ATTR.businessPrefix.length)] = value;
    }
  }

  return {
    id: workflowId,
    name,
    version: stringAttr(attrs, OTEL_ATTR.workflowVersion) ?? "0.0.0",
    environment: stringAttr(attrs, OTEL_ATTR.workflowEnvironment) ?? "development",
    businessKeys,
    status: "running",
    startedAt: nanosToDate(span.startTimeUnixNano),
    endedAt: null,
    traceId: span.traceId,
    metadata: null,
  };
}

function spanToWorkflow(
  span: OtlpSpan,
  attrs: Map<string, unknown>,
): NewWorkflowRow | null {
  const id = stringAttr(attrs, OTEL_ATTR.workflowId);
  const name = stringAttr(attrs, OTEL_ATTR.workflowName);
  if (!id || !name) return null;

  const businessKeys: Record<string, string> = {};
  for (const [key, value] of attrs) {
    if (key.startsWith(OTEL_ATTR.businessPrefix) && typeof value === "string") {
      businessKeys[key.slice(OTEL_ATTR.businessPrefix.length)] = value;
    }
  }

  const startedAt = nanosToDate(span.startTimeUnixNano);
  const endedAt = span.endTimeUnixNano ? nanosToDate(span.endTimeUnixNano) : null;
  const statusCode = span.status?.code ?? 0;
  const status: WorkflowStatus = endedAt
    ? statusCode === STATUS_ERROR
      ? "failed"
      : "success"
    : "running";

  return {
    id,
    name,
    version: stringAttr(attrs, OTEL_ATTR.workflowVersion) ?? "0.0.0",
    environment: stringAttr(attrs, OTEL_ATTR.workflowEnvironment) ?? "development",
    businessKeys,
    status,
    startedAt,
    endedAt,
    traceId: span.traceId,
    metadata: parseJsonAttr(attrs, "betterlog.workflow.metadata") as
      | Record<string, unknown>
      | null,
  };
}

function spanToStep(
  span: OtlpSpan,
  attrs: Map<string, unknown>,
  defaultService: string,
): NewStepRow | null {
  const workflowId = stringAttr(attrs, OTEL_ATTR.workflowId);
  const name = stringAttr(attrs, OTEL_ATTR.stepName) ?? span.name.slice(STEP_PREFIX.length);
  if (!workflowId || !name) return null;

  const startedAt = nanosToDate(span.startTimeUnixNano);
  const endedAt = span.endTimeUnixNano ? nanosToDate(span.endTimeUnixNano) : null;
  const statusCode = span.status?.code ?? 0;

  const declaredStatus = stringAttr(attrs, OTEL_ATTR.stepStatus) as StepStatus | undefined;
  const status: StepStatus =
    declaredStatus ??
    (statusCode === STATUS_ERROR
      ? "failed"
      : statusCode === STATUS_OK
        ? "success"
        : endedAt
          ? "success"
          : "started");

  return {
    id: span.spanId,
    workflowId,
    name,
    service: stringAttr(attrs, OTEL_ATTR.stepService) ?? defaultService,
    status,
    startedAt,
    endedAt,
    input: parseJsonAttr(attrs, "betterlog.step.input"),
    output: parseJsonAttr(attrs, "betterlog.step.output"),
    error:
      status === "failed"
        ? (parseJsonAttr(attrs, "betterlog.step.error") as
            | { message: string; code?: string; stack?: string }
            | null) ?? {
            message: span.status?.message ?? "unknown error",
          }
        : null,
    spanId: span.spanId,
    parentStepId: span.parentSpanId ?? null,
  };
}

function attrsToMap(attrs: OtlpKeyValue[] | undefined): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (!attrs) return out;
  for (const a of attrs) {
    out.set(a.key, anyValueToJs(a.value));
  }
  return out;
}

function anyValueToJs(v: OtlpKeyValue["value"]): unknown {
  if (!v) return undefined;
  const value = v as Record<string, unknown>;
  if (typeof value.stringValue === "string") return value.stringValue;
  if (typeof value.boolValue === "boolean") return value.boolValue;
  if (value.intValue !== undefined) return Number(value.intValue as string | number);
  if (typeof value.doubleValue === "number") return value.doubleValue;
  if (value.arrayValue) return value.arrayValue;
  if (value.kvlistValue) return value.kvlistValue;
  return undefined;
}

function stringAttr(attrs: Map<string, unknown>, key: string): string | undefined {
  const v = attrs.get(key);
  return typeof v === "string" ? v : undefined;
}

function parseJsonAttr(attrs: Map<string, unknown>, key: string): unknown {
  const v = attrs.get(key);
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function nanosToDate(nanos: string | number): Date {
  // JS numbers lose precision at this scale; do the divide as a BigInt.
  const big = typeof nanos === "bigint" ? nanos : BigInt(nanos);
  return new Date(Number(big / 1_000_000n));
}
