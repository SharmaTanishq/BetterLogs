import Fastify, { type FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "@fastify/type-provider-zod";
import { type Config } from "./config.js";
import { db } from "./db/client.js";
import { createEmbeddingPoller } from "./embeddings/poller.js";
import { registerDiagnoseRoute } from "./routes/diagnose.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerOtlpRoute } from "./routes/otlp.js";

export function buildServer(config: Config): FastifyInstance {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss.l" } }
          : undefined,
    },
    disableRequestLogging: false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  registerHealthRoute(app);
  registerOtlpRoute(app, config);
  registerDiagnoseRoute(app, config);

  if (config.BETTERLOG_EMBEDDING_ENABLED) {
    const poller = createEmbeddingPoller({ db, config, logger: app.log });
    app.addHook("onReady", async () => {
      poller.start();
    });
    app.addHook("onClose", async () => {
      await poller.stop();
    });
  } else {
    app.log.info("failure-embedding poller disabled (BETTERLOG_EMBEDDING_ENABLED=false)");
  }

  return app;
}
