/**
 * OTLP/HTTP receiver. Accepts the trace export request the BetterLog SDK
 * (or any OTel exporter) sends, classifies spans into workflows/steps,
 * and writes them to Postgres.
 *
 * Per build-plan.md §2 + §3: this is the ONLY ingestion path. No separate
 * OTel Collector. Auth is a single workspace API key in the Authorization
 * header — the receiver rejects 401 otherwise.
 */

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Config } from "../config.js";
import { db } from "../db/client.js";
import { parseExport } from "../ingestion/otlp-parse.js";
import { ExportTraceRequest } from "../ingestion/otlp-types.js";
import { writeBatch } from "../ingestion/otlp-write.js";

const OTLP_MAX_BODY = 10 * 1024 * 1024;

export function registerOtlpRoute(app: FastifyInstance, config: Config): void {
  app.post(
    "/v1/otlp/traces",
    { bodyLimit: OTLP_MAX_BODY },
    async (req, reply) => {
      if (!checkAuth(req, config)) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      const parsed = ExportTraceRequest.safeParse(req.body);
      if (!parsed.success) {
        req.log.warn({ issues: parsed.error.issues }, "OTLP body failed validation");
        return reply.code(400).send({ error: "bad_request", issues: parsed.error.issues });
      }

      const batch = parseExport(parsed.data);

      try {
        await writeBatch(db, batch);
      } catch (err) {
        req.log.error({ err }, "OTLP write failed");
        return reply.code(500).send({ error: "write_failed" });
      }

      req.log.info(
        { workflows: batch.workflows.length, steps: batch.steps.length, skipped: batch.skipped },
        "OTLP batch ingested",
      );

      return reply.code(200).send({ partialSuccess: {} });
    },
  );
}

function checkAuth(req: FastifyRequest, config: Config): boolean {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return false;
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const presented = header.slice(7).trim();
  if (presented === config.BETTERLOG_API_KEY) return true;
  if (config.BETTERLOG_PUBLISHABLE_API_KEY && presented === config.BETTERLOG_PUBLISHABLE_API_KEY) {
    return true;
  }
  return false;
}
