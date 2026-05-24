/**
 * Upsert a ParsedBatch into Postgres.
 *
 * Workflows are upserted first (steps reference workflows via FK).
 * Both tables use ON CONFLICT DO UPDATE so re-delivered spans are idempotent.
 */

import { sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { steps, workflows } from "../db/schema.js";
import type { ParsedBatch } from "./otlp-parse.js";

export async function writeBatch(db: Db, batch: ParsedBatch): Promise<void> {
  if (batch.workflows.length > 0) {
    await db
      .insert(workflows)
      .values(batch.workflows)
      .onConflictDoUpdate({
        target: workflows.id,
        set: {
          status: sql`excluded.status`,
          endedAt: sql`excluded.ended_at`,
          businessKeys: sql`excluded.business_keys`,
          metadata: sql`excluded.metadata`,
        },
      });
  }

  if (batch.steps.length > 0) {
    await db
      .insert(steps)
      .values(batch.steps)
      .onConflictDoUpdate({
        target: steps.id,
        set: {
          status: sql`excluded.status`,
          endedAt: sql`excluded.ended_at`,
          output: sql`excluded.output`,
          error: sql`excluded.error`,
        },
      });
  }
}
