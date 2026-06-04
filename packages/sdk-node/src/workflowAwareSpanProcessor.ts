/**
 * WorkflowAwareSpanProcessor — wraps a downstream `SpanProcessor` to keep
 * step spans hidden from the exporter until their parent workflow span has
 * ended.
 *
 * Why we need it
 * ==============
 *
 * The BetterLog API enforces a foreign key from `steps.workflow_id` to
 * `workflows.id` (apps/api/src/db/schema.ts). The OTLP writer
 * (apps/api/src/ingestion/otlp-write.ts) inserts workflows first, then
 * steps, in a single transactional batch — but only what arrives in *that*
 * HTTP POST. Once a batch is rejected for an FK violation, the step rows
 * inside it are gone.
 *
 * OpenTelemetry's `BatchSpanProcessor` defaults to a 5s scheduled flush.
 * For workflows that finish in well under 5s (the wilco-order-demo) every
 * span — workflow plus children — is queued and shipped together at
 * shutdown, so the FK is satisfied. Agent runs are different: they make
 * several round trips to the LLM and routinely take 20–40s. The BSP fires
 * mid-run, ships only the step spans that have ended so far, and the API
 * rejects the whole batch because the `workflow:agent.run` span is still
 * open. The eventual final batch contains the workflow row but zero step
 * rows. End result: workflow row in Postgres, no steps.
 *
 * What this does
 * ==============
 *
 * Wraps the customer's exporting `SpanProcessor` (typically a
 * `BatchSpanProcessor`) and intercepts `onEnd`:
 *
 *   - `step:*` spans carrying a `betterlog.workflow.id` are buffered
 *     in-memory keyed by that workflow id, instead of being forwarded.
 *   - When the matching `workflow:*` span ends, we forward the workflow
 *     span first and then drain every buffered step span for that id —
 *     synchronously, so they all land in the same BSP queue tick. The
 *     next exporter flush carries the workflow row and its steps in one
 *     OTLP batch, which the API writes inside one transaction.
 *   - Step spans whose workflow has already ended (e.g. a non-awaited
 *     fire-and-forget step that resolved late) pass through immediately;
 *     by then the workflow row is durable in Postgres so the FK is fine.
 *   - Spans without a `betterlog.workflow.id`, or with names outside the
 *     `workflow:`/`step:` convention, pass through unchanged.
 *
 * The wrapped processor still owns batching, retry, and shutdown — we
 * only reorder when steps reach it.
 */

import type { Context } from "@opentelemetry/api";
import type {
  ReadableSpan,
  Span,
  SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { OTEL_ATTR } from "@betterlog/shared";
import { isRemoteWorkflow } from "./context.js";

const WORKFLOW_PREFIX = "workflow:";
const STEP_PREFIX = "step:";

/**
 * How many recently-completed workflow ids to remember so that late step
 * spans can pass straight through. Bounded to keep memory steady in
 * long-running services. The number is well above the per-process
 * concurrency we expect — overflow only matters if you have >MAX_COMPLETED
 * workflows finishing while one of their step spans is still in flight,
 * which is unusual.
 */
const MAX_COMPLETED = 1024;

export class WorkflowAwareSpanProcessor implements SpanProcessor {
  private readonly pending = new Map<string, ReadableSpan[]>();
  private readonly completed = new Set<string>();

  constructor(private readonly inner: SpanProcessor) {}

  onStart(span: Span, parentContext: Context): void {
    this.inner.onStart(span, parentContext);
  }

  onEnd(span: ReadableSpan): void {
    const workflowId = span.attributes[OTEL_ATTR.workflowId];
    if (typeof workflowId !== "string") {
      this.inner.onEnd(span);
      return;
    }

    if (span.name.startsWith(WORKFLOW_PREFIX)) {
      this.inner.onEnd(span);
      const buffered = this.pending.get(workflowId);
      if (buffered !== undefined) {
        for (const child of buffered) this.inner.onEnd(child);
        this.pending.delete(workflowId);
      }
      this.markCompleted(workflowId);
      return;
    }

    if (span.name.startsWith(STEP_PREFIX)) {
      if (isRemoteWorkflow(workflowId) || this.completed.has(workflowId)) {
        // Workflow span has already shipped (and presumably been written),
        // so this orphaned step is safe to forward directly.
        this.inner.onEnd(span);
        return;
      }
      let bucket = this.pending.get(workflowId);
      if (bucket === undefined) {
        bucket = [];
        this.pending.set(workflowId, bucket);
      }
      bucket.push(span);
      return;
    }

    this.inner.onEnd(span);
  }

  async forceFlush(): Promise<void> {
    // Drain whatever's buffered. If a workflow:* span hasn't ended these
    // step rows will be rejected by the API on FK violation — which is
    // strictly no worse than the pre-fix behaviour. In normal use
    // forceFlush is only called from shutdown, by which point withWorkflow
    // has already resolved and pending should be empty.
    this.drainAll();
    await this.inner.forceFlush();
  }

  async shutdown(): Promise<void> {
    this.drainAll();
    await this.inner.shutdown();
  }

  private drainAll(): void {
    for (const bucket of this.pending.values()) {
      for (const span of bucket) this.inner.onEnd(span);
    }
    this.pending.clear();
  }

  private markCompleted(workflowId: string): void {
    if (this.completed.has(workflowId)) return;
    if (this.completed.size >= MAX_COMPLETED) {
      const oldest = this.completed.values().next().value;
      if (oldest !== undefined) this.completed.delete(oldest);
    }
    this.completed.add(workflowId);
  }
}
