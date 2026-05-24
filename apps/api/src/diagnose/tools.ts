/**
 * The 6 diagnose tools the single agent can call (SPEC.md §5).
 *
 * Each tool returns plain JS objects; the AI SDK serializes them as JSON
 * back into the model context for the next step of the agent loop.
 */

import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { tool } from "ai";
import { z } from "zod";
import type { Db } from "../db/client.js";
import type { Embedder } from "../embeddings/embed.js";
import { failureEmbeddings, steps, workflows } from "../db/schema.js";

const TIME_WINDOWS = ["15m", "1h", "6h", "24h", "7d"] as const;
type TimeWindow = (typeof TIME_WINDOWS)[number];

function windowToMs(w: TimeWindow): number {
  switch (w) {
    case "15m":
      return 15 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export interface BuildToolsDeps {
  db: Db;
  /**
   * Optional. When present, find_similar_failures can embed free-form
   * `query_text` on the fly. When absent (e.g. tests, or OPENAI_API_KEY
   * unset), the tool degrades to workflow_id-only lookups and returns a
   * clear note when asked to embed text.
   */
  embedder?: Embedder;
}

export function buildTools(deps: BuildToolsDeps) {
  const { db, embedder } = deps;
  return {
    get_workflow: tool({
      description:
        "Fetch a workflow by its id, plus every step that belongs to it. " +
        "Use this once you know the workflow_id and need the full timeline " +
        "(step names, statuses, inputs, outputs, errors) to diagnose what went wrong.",
      inputSchema: z.object({
        workflow_id: z.string().describe("ulid of the workflow"),
      }),
      execute: async ({ workflow_id }) => {
        const wf = await db.select().from(workflows).where(eq(workflows.id, workflow_id)).limit(1);
        if (wf.length === 0) return { found: false as const };
        const wfSteps = await db
          .select()
          .from(steps)
          .where(eq(steps.workflowId, workflow_id))
          .orderBy(steps.startedAt);
        return { found: true as const, workflow: wf[0], steps: wfSteps };
      },
    }),

    find_workflow_by_business_key: tool({
      description:
        "Look up workflows by a business key (e.g. order_id). Use this when " +
        "a human asks about an order/invoice/customer by its human-readable id " +
        "and you don't yet have the BetterLog workflow_id.",
      inputSchema: z.object({
        key_name: z
          .string()
          .describe("the business key field name, e.g. 'order_id' or 'invoice_id'"),
        key_value: z.string().describe("the value to match, e.g. '1234' or 'demo-4925'"),
      }),
      execute: async ({ key_name, key_value }) => {
        const rows = await db
          .select()
          .from(workflows)
          .where(sql`${workflows.businessKeys} @> ${JSON.stringify({ [key_name]: key_value })}`)
          .orderBy(desc(workflows.startedAt))
          .limit(10);
        return { matches: rows.length, workflows: rows };
      },
    }),

    search_recent_failures: tool({
      description:
        "List recently failed workflows of a given workflow_name within a time window. " +
        "Use this when investigating patterns (e.g. 'why are orders failing today').",
      inputSchema: z.object({
        workflow_name: z.string().describe("e.g. 'order.fulfillment'"),
        time_window: z
          .enum(TIME_WINDOWS)
          .default("1h")
          .describe("one of: 15m, 1h, 6h, 24h, 7d"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ workflow_name, time_window, limit }) => {
        const since = new Date(Date.now() - windowToMs(time_window));
        const rows = await db
          .select()
          .from(workflows)
          .where(
            and(
              eq(workflows.name, workflow_name),
              eq(workflows.status, "failed"),
              gte(workflows.startedAt, since),
            ),
          )
          .orderBy(desc(workflows.startedAt))
          .limit(limit);
        return { count: rows.length, workflows: rows };
      },
    }),

    get_step_payload: tool({
      description:
        "Fetch the full input + output + error payload of a single step by step_id. " +
        "Use this when get_workflow's response is truncated or you need to inspect " +
        "one specific step in detail (e.g. the failing one).",
      inputSchema: z.object({
        step_id: z.string().describe("the step row's id (same as the OTel span_id)"),
      }),
      execute: async ({ step_id }) => {
        const row = await db.select().from(steps).where(eq(steps.id, step_id)).limit(1);
        if (row.length === 0) return { found: false as const };
        return { found: true as const, step: row[0] };
      },
    }),

    get_pipeline_stats: tool({
      description:
        "Aggregate counts of running/success/failed workflows for a workflow_name in a " +
        "time window. Use this to answer health-style questions like " +
        "'is the order pipeline healthy?'.",
      inputSchema: z.object({
        workflow_name: z.string(),
        time_window: z.enum(TIME_WINDOWS).default("1h"),
      }),
      execute: async ({ workflow_name, time_window }) => {
        const since = new Date(Date.now() - windowToMs(time_window));
        const rows = await db
          .select({ status: workflows.status, n: count() })
          .from(workflows)
          .where(and(eq(workflows.name, workflow_name), gte(workflows.startedAt, since)))
          .groupBy(workflows.status);
        const totals: Record<string, number> = {};
        for (const r of rows) totals[r.status] = Number(r.n);
        const total = Object.values(totals).reduce((a, b) => a + b, 0);
        const failed = totals["failed"] ?? 0;
        return {
          workflow_name,
          time_window,
          total,
          by_status: totals,
          failure_rate: total > 0 ? failed / total : 0,
        };
      },
    }),

    find_similar_failures: tool({
      description:
        "Search past failed workflows for ones whose failure signature " +
        "(workflow name + failing step + error code + message) is semantically " +
        "similar to either a specific workflow_id or to free-form query_text. " +
        "Use this whenever diagnosing a specific failure to check 'have we seen " +
        "this kind of failure before?' and to ground your answer in prior incidents.",
      inputSchema: z
        .object({
          workflow_id: z
            .string()
            .optional()
            .describe(
              "Find failures like THIS one. The tool reuses the workflow's existing embedding; " +
                "if no embedding exists yet (poller runs every ~30s), returns an empty result " +
                "with a note rather than erroring.",
            ),
          query_text: z
            .string()
            .optional()
            .describe(
              "Free-form description of the failure shape to search for, e.g. " +
                "'back40.push step failing with SKU_MAPPING_MISSING'. Embedded on the fly.",
            ),
          limit: z
            .number()
            .int()
            .min(1)
            .max(10)
            .default(5)
            .describe("How many similar failures to return (max 10)."),
        })
        .refine((v) => v.workflow_id != null || v.query_text != null, {
          message: "At least one of workflow_id or query_text must be set.",
        }),
      execute: async ({ workflow_id, query_text, limit }) => {
        let queryEmbedding: number[];
        let excludeWorkflowId: string | null = null;

        if (workflow_id) {
          const existing = await db
            .select({ embedding: failureEmbeddings.embedding })
            .from(failureEmbeddings)
            .where(eq(failureEmbeddings.workflowId, workflow_id))
            .limit(1);

          if (existing.length > 0 && existing[0]) {
            queryEmbedding = existing[0].embedding as unknown as number[];
            excludeWorkflowId = workflow_id;
          } else if (query_text) {
            if (!embedder) {
              return {
                similar: [] as SimilarFailure[],
                note: "query_text given but the embedder is unavailable in this environment.",
              };
            }
            queryEmbedding = await embedder.embed(query_text);
            excludeWorkflowId = workflow_id;
          } else {
            return {
              similar: [] as SimilarFailure[],
              note: "Query workflow has no embedding yet — try again in ~30s, or pass query_text.",
            };
          }
        } else {
          if (!embedder) {
            return {
              similar: [] as SimilarFailure[],
              note: "query_text given but the embedder is unavailable in this environment.",
            };
          }
          if (!query_text) {
            return {
              similar: [] as SimilarFailure[],
              note: "Neither workflow_id nor query_text was provided.",
            };
          }
          queryEmbedding = await embedder.embed(query_text);
        }

        const vectorLiteral = toPgVectorLiteral(queryEmbedding);

        const rows = await db.execute<{
          workflow_id: string;
          summary: string;
          name: string;
          business_keys: Record<string, string>;
          started_at: Date;
          ended_at: Date | null;
          similarity: number;
        }>(sql`
          SELECT fe.workflow_id, fe.summary, w.name, w.business_keys,
                 w.started_at, w.ended_at,
                 (1 - (fe.embedding <=> ${vectorLiteral}::vector))::float AS similarity
          FROM failure_embeddings fe
          JOIN workflows w ON w.id = fe.workflow_id
          ${excludeWorkflowId ? sql`WHERE fe.workflow_id != ${excludeWorkflowId}` : sql``}
          ORDER BY fe.embedding <=> ${vectorLiteral}::vector
          LIMIT ${limit}
        `);

        const similar: SimilarFailure[] = [];
        for (const r of rows as unknown as Array<{
          workflow_id: string;
          summary: string;
          name: string;
          business_keys: Record<string, string>;
          started_at: Date | string;
          ended_at: Date | string | null;
          similarity: number | string;
        }>) {
          similar.push({
            workflow_id: r.workflow_id,
            similarity: typeof r.similarity === "string" ? Number(r.similarity) : r.similarity,
            name: r.name,
            business_keys: r.business_keys,
            summary: r.summary,
            started_at: toIso(r.started_at),
            ended_at: r.ended_at ? toIso(r.ended_at) : null,
          });
        }

        return { similar };
      },
    }),
  } as const;
}

interface SimilarFailure {
  workflow_id: string;
  similarity: number;
  name: string;
  business_keys: Record<string, string>;
  summary: string;
  started_at: string;
  ended_at: string | null;
}

function toPgVectorLiteral(values: number[]): string {
  // pgvector accepts '[1,2,3]' as a text literal cast to ::vector.
  return `[${values.join(",")}]`;
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

export type DiagnoseTools = ReturnType<typeof buildTools>;
