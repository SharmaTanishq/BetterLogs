/**
 * Failure-embedding background poller.
 *
 * Why a setInterval and not a queue/cron? Per build-plan §9: "No queue/worker
 * tier." Single in-process timer is the right tool at MVP scale (likely tens
 * of failures per hour at most). When the workflow set gets large enough that
 * the LEFT JOIN starts to feel slow, swap to LISTEN/NOTIFY off the
 * outcomes-insert path; the public contract (failure_embeddings has rows for
 * every failed workflow within ~30s) is the only thing callers depend on.
 *
 * Per-workflow try/catch is intentional: one bad workflow shouldn't kill the
 * loop, and we don't retry within the same tick — the row stays uninserted
 * and the next tick's LEFT JOIN picks it up automatically.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import type { Db } from "../db/client.js";
import { failureEmbeddings, steps, workflows } from "../db/schema.js";
import type { StepRow, WorkflowRow } from "../db/schema.js";
import type { Config } from "../config.js";
import { type Embedder, createEmbedder } from "./embed.js";
import { composeEmbedText } from "./text.js";

export interface EmbeddingPoller {
  start(): void;
  stop(): Promise<void>;
  /** Run one tick synchronously — useful for tests and manual triggers. */
  runOnce(): Promise<EmbedTickResult>;
}

export interface EmbedTickResult {
  scanned: number;
  embedded: number;
  failed: number;
}

interface PollerDeps {
  db: Db;
  config: Config;
  logger: FastifyBaseLogger;
  embedder?: Embedder;
}

export function createEmbeddingPoller(deps: PollerDeps): EmbeddingPoller {
  const { db, config, logger } = deps;
  const embedder = deps.embedder ?? createEmbedder(config);
  const batchSize = config.BETTERLOG_EMBEDDING_BATCH_SIZE;
  const intervalMs = config.BETTERLOG_EMBEDDING_POLL_INTERVAL_MS;

  let timer: NodeJS.Timeout | null = null;
  let running = false;
  let inFlight: Promise<EmbedTickResult> | null = null;

  async function tick(): Promise<EmbedTickResult> {
    const result: EmbedTickResult = { scanned: 0, embedded: 0, failed: 0 };

    const pending = await db
      .select()
      .from(workflows)
      .leftJoin(failureEmbeddings, eq(failureEmbeddings.workflowId, workflows.id))
      .where(and(eq(workflows.status, "failed"), isNull(failureEmbeddings.workflowId)))
      .limit(batchSize);

    result.scanned = pending.length;
    if (pending.length === 0) return result;

    for (const row of pending) {
      const workflow = row.workflows as WorkflowRow;
      try {
        const failedStep = await lastFailedStep(db, workflow.id);
        const summary = composeEmbedText(workflow, failedStep);
        const vector = await embedder.embed(summary);

        await db
          .insert(failureEmbeddings)
          .values({ workflowId: workflow.id, embedding: vector, summary })
          .onConflictDoNothing({ target: failureEmbeddings.workflowId });

        result.embedded += 1;
      } catch (err) {
        result.failed += 1;
        logger.warn(
          { err, workflowId: workflow.id },
          "failure-embedding: skipped one workflow; will retry on next tick",
        );
      }
    }

    return result;
  }

  async function runOnce(): Promise<EmbedTickResult> {
    if (inFlight) return inFlight;
    inFlight = tick().finally(() => {
      inFlight = null;
    });
    try {
      const r = await inFlight;
      if (r.scanned > 0) {
        logger.info(
          { scanned: r.scanned, embedded: r.embedded, failed: r.failed, model: embedder.modelName },
          "failure-embedding tick",
        );
      } else {
        logger.debug({ model: embedder.modelName }, "failure-embedding tick (nothing pending)");
      }
      return r;
    } catch (err) {
      logger.error({ err }, "failure-embedding tick crashed");
      return { scanned: 0, embedded: 0, failed: 0 };
    }
  }

  function start(): void {
    if (running) return;
    running = true;
    logger.info(
      { intervalMs, batchSize, model: embedder.modelName },
      "failure-embedding poller starting",
    );
    timer = setInterval(() => {
      void runOnce();
    }, intervalMs);
    // Fire once immediately so newly-failed workflows don't have to wait a
    // full interval on startup.
    void runOnce();
  }

  async function stop(): Promise<void> {
    if (!running) return;
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (inFlight) await inFlight.catch(() => undefined);
    logger.info("failure-embedding poller stopped");
  }

  return { start, stop, runOnce };
}

async function lastFailedStep(db: Db, workflowId: string): Promise<StepRow | null> {
  const rows = await db
    .select()
    .from(steps)
    .where(and(eq(steps.workflowId, workflowId), eq(steps.status, "failed")))
    .orderBy(desc(sql`coalesce(${steps.endedAt}, ${steps.startedAt})`))
    .limit(1);
  return rows[0] ?? null;
}
