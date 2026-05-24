import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Single hardcoded workspace API key for MVP. Per build-plan §2. */
  BETTERLOG_API_KEY: z.string().min(1).default("blg_dev_localonly"),

  /**
   * LLM provider for the diagnose agent. Runtime-selectable per build-plan §2.
   * Adding a provider = add a branch in apps/api/src/llm/model.ts.
   */
  BETTERLOG_LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  BETTERLOG_LLM_MODEL: z.string().default("gpt-5-mini"),

  /** Picked up by the AI SDK provider packages directly. Optional at boot. */
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  /**
   * Failure-embedding background poller knobs. The poller is the only writer
   * to `failure_embeddings`; disabling it cleanly means find_similar_failures
   * keeps working but returns empty results until something else populates
   * the table.
   */
  BETTERLOG_EMBEDDING_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  BETTERLOG_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  BETTERLOG_EMBEDDING_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(30_000),
  BETTERLOG_EMBEDDING_BATCH_SIZE: z.coerce.number().int().positive().max(200).default(20),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
