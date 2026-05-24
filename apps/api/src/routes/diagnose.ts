import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { Config } from "../config.js";
import { db } from "../db/client.js";
import { diagnose } from "../diagnose/agent.js";
import { createEmbedder, type Embedder } from "../embeddings/embed.js";
import { createModel } from "../llm/model.js";

const DiagnoseBody = z.object({
  question: z.string().min(1),
  workflow_id: z.string().optional(),
});

const DiagnoseResponse = z.object({
  answer: z.string(),
  tool_calls: z.array(
    z.object({
      tool: z.string(),
      input: z.unknown(),
      output: z.unknown(),
    }),
  ),
  step_count: z.number(),
  finish_reason: z.string(),
});

const ErrorResponse = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export function registerDiagnoseRoute(app: FastifyInstance, config: Config): void {
  // Build the embedder once at route-register time. It's cheap and stateless,
  // and lets find_similar_failures embed query_text on demand. Falls back to
  // undefined (and the tool degrades gracefully) when no OPENAI_API_KEY.
  let embedder: Embedder | undefined;
  try {
    embedder = createEmbedder(config);
  } catch (err) {
    app.log.warn({ err }, "embedder unavailable: find_similar_failures will skip query_text path");
    embedder = undefined;
  }

  app.post(
    "/v1/diagnose",
    {
      schema: {
        body: DiagnoseBody,
        response: { 200: DiagnoseResponse, 401: ErrorResponse, 500: ErrorResponse },
      },
    },
    async (req, reply) => {
      if (!checkAuth(req, config.BETTERLOG_API_KEY)) {
        return reply.code(401).send({ error: "unauthorized" });
      }

      const model = createModel(config);
      const body = req.body as z.infer<typeof DiagnoseBody>;

      try {
        const result = await diagnose(model, { db, embedder }, body);
        req.log.info(
          {
            question: body.question,
            steps: result.step_count,
            finish: result.finish_reason,
            tools_used: result.tool_calls.map((t) => t.tool),
          },
          "diagnose completed",
        );
        return reply.code(200).send(result);
      } catch (err) {
        req.log.error({ err }, "diagnose failed");
        const message = err instanceof Error ? err.message : String(err);
        return reply.code(500).send({ error: "diagnose_failed", message });
      }
    },
  );
}

function checkAuth(req: FastifyRequest, expected: string): boolean {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return false;
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  return header.slice(7).trim() === expected;
}
