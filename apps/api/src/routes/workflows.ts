/**
 * Workflow read API — businessKey search and timeline retrieval.
 */

import { desc, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Config } from "../config.js";
import { db } from "../db/client.js";
import { steps, workflows } from "../db/schema.js";

const BusinessKeyQuery = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export function registerWorkflowRoutes(app: FastifyInstance, config: Config): void {
  app.get("/v1/workflows", async (req, reply) => {
    if (!checkAuth(req.headers["authorization"], config)) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const parsed = BusinessKeyQuery.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "bad_request", issues: parsed.error.issues });
    }

    const { key, value, limit } = parsed.data;
    const rows = await db
      .select()
      .from(workflows)
      .where(sql`${workflows.businessKeys} @> ${JSON.stringify({ [key]: value })}`)
      .orderBy(desc(workflows.startedAt))
      .limit(limit);

    return reply.send({
      matches: rows.length,
      workflows: rows.map(serializeWorkflow),
    });
  });

  app.get("/v1/workflows/:id", async (req, reply) => {
    if (!checkAuth(req.headers["authorization"], config)) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const { id } = req.params as { id: string };
    const wf = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
    if (wf.length === 0) {
      return reply.code(404).send({ error: "not_found" });
    }

    const wfSteps = await db
      .select()
      .from(steps)
      .where(eq(steps.workflowId, id))
      .orderBy(steps.startedAt);

    return reply.send({
      workflow: serializeWorkflow(wf[0]!),
      steps: wfSteps.map(serializeStep),
    });
  });
}

function checkAuth(header: string | string[] | undefined, config: Config): boolean {
  if (typeof header !== "string") return false;
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const presented = header.slice(7).trim();
  if (presented === config.BETTERLOG_API_KEY) return true;
  if (config.BETTERLOG_PUBLISHABLE_API_KEY && presented === config.BETTERLOG_PUBLISHABLE_API_KEY) {
    return true;
  }
  return false;
}

function serializeWorkflow(w: typeof workflows.$inferSelect) {
  return {
    id: w.id,
    name: w.name,
    version: w.version,
    environment: w.environment,
    business_keys: w.businessKeys,
    status: w.status,
    started_at: w.startedAt.toISOString(),
    ended_at: w.endedAt?.toISOString() ?? null,
    trace_id: w.traceId,
    metadata: w.metadata ?? null,
  };
}

function serializeStep(s: typeof steps.$inferSelect) {
  return {
    id: s.id,
    workflow_id: s.workflowId,
    name: s.name,
    service: s.service,
    status: s.status,
    started_at: s.startedAt.toISOString(),
    ended_at: s.endedAt?.toISOString() ?? null,
    input: s.input ?? null,
    output: s.output ?? null,
    error: s.error ?? null,
    span_id: s.spanId,
    parent_step_id: s.parentStepId ?? null,
  };
}
