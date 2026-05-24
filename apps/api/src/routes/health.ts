import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";

const HealthResponse = z.object({
  status: z.enum(["ok", "degraded"]),
  db: z.enum(["ok", "down"]),
  version: z.string(),
});

export function registerHealthRoute(app: FastifyInstance): void {
  app.get(
    "/health",
    {
      schema: {
        response: { 200: HealthResponse, 503: HealthResponse },
      },
    },
    async (_req, reply) => {
      let dbOk = false;
      try {
        await db.execute(sql`SELECT 1`);
        dbOk = true;
      } catch (err) {
        app.log.warn({ err }, "health: db ping failed");
      }
      const body = {
        status: dbOk ? ("ok" as const) : ("degraded" as const),
        db: dbOk ? ("ok" as const) : ("down" as const),
        version: "0.0.0",
      };
      return reply.code(dbOk ? 200 : 503).send(body);
    },
  );
}
