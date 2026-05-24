/**
 * Drizzle schema. Mirrors the DDL in SPEC.md §3 exactly.
 *
 * pgvector requires `CREATE EXTENSION IF NOT EXISTS vector;` to be applied
 * before the first migration that touches failure_embeddings runs.
 * See drizzle/0000_init.sql once generated.
 */

import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";
import type {
  StepStatus,
  TerminalWorkflowStatus,
  WorkflowStatus,
} from "@betterlog/shared";

export const workflows = pgTable(
  "workflows",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    version: text("version").notNull(),
    environment: text("environment").notNull(),
    businessKeys: jsonb("business_keys").$type<Record<string, string>>().notNull(),
    status: text("status").$type<WorkflowStatus>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    traceId: text("trace_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (t) => [
    index("idx_workflows_name_started").on(t.name, t.startedAt.desc()),
    index("idx_workflows_business_keys").using("gin", t.businessKeys),
    index("idx_workflows_status_started").on(t.status, t.startedAt.desc()),
  ],
);

export const steps = pgTable(
  "steps",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflows.id),
    name: text("name").notNull(),
    service: text("service").notNull(),
    status: text("status").$type<StepStatus>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    input: jsonb("input"),
    output: jsonb("output"),
    error: jsonb("error").$type<{ message: string; code?: string; stack?: string }>(),
    spanId: text("span_id").notNull(),
    parentStepId: text("parent_step_id"),
  },
  (t) => [
    index("idx_steps_workflow").on(t.workflowId, t.startedAt),
    index("idx_steps_status")
      .on(t.status, t.startedAt.desc())
      .where(sql`${t.status} = 'failed'`),
  ],
);

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflows.id),
    stepId: text("step_id").references(() => steps.id),
    type: text("type").notNull(),
    service: text("service").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    data: jsonb("data").$type<Record<string, unknown>>(),
  },
  (t) => [index("idx_events_workflow_ts").on(t.workflowId, t.timestamp)],
);

export const outcomes = pgTable("outcomes", {
  workflowId: text("workflow_id")
    .primaryKey()
    .references(() => workflows.id),
  status: text("status").$type<TerminalWorkflowStatus>().notNull(),
  reasonCode: text("reason_code"),
  reasonText: text("reason_text"),
  remediationTaken: text("remediation_taken"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by"),
});

export const failureEmbeddings = pgTable(
  "failure_embeddings",
  {
    workflowId: text("workflow_id")
      .primaryKey()
      .references(() => workflows.id),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    summary: text("summary").notNull(),
  },
  (t) => [
    index("idx_failure_embeddings_hnsw").using("hnsw", t.embedding.op("vector_cosine_ops")),
  ],
);

export type WorkflowRow = typeof workflows.$inferSelect;
export type NewWorkflowRow = typeof workflows.$inferInsert;
export type StepRow = typeof steps.$inferSelect;
export type NewStepRow = typeof steps.$inferInsert;
export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
export type OutcomeRow = typeof outcomes.$inferSelect;
export type NewOutcomeRow = typeof outcomes.$inferInsert;
export type FailureEmbeddingRow = typeof failureEmbeddings.$inferSelect;
export type NewFailureEmbeddingRow = typeof failureEmbeddings.$inferInsert;
