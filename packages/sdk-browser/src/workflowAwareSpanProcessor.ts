import type { Context } from "@opentelemetry/api";
import type { ReadableSpan, Span, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTEL_ATTR } from "@betterlog/shared";
import { isRemoteWorkflow } from "./context.js";

const WORKFLOW_PREFIX = "workflow:";
const STEP_PREFIX = "step:";
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
