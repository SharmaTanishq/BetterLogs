/**
 * Thin wrapper over the Vercel AI SDK `embed()` call.
 *
 * OpenAI-only for MVP: Anthropic doesn't expose an embedding model through
 * the AI SDK, and the failure_embeddings schema has 1536 dims baked in
 * (matches text-embedding-3-small). BYOK embeddings can come later behind
 * a schema-per-provider or provider-tagged columns — out of scope here.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import type { Config } from "../config.js";

export interface Embedder {
  embed(text: string): Promise<number[]>;
  modelName: string;
}

export function createEmbedder(config: Config): Embedder {
  if (!config.OPENAI_API_KEY) {
    throw new Error(
      "Failure-embedding poller is enabled but OPENAI_API_KEY is not set. " +
        "Either set OPENAI_API_KEY or BETTERLOG_EMBEDDING_ENABLED=false.",
    );
  }

  const openai = createOpenAI({ apiKey: config.OPENAI_API_KEY });
  const model = openai.embedding(config.BETTERLOG_EMBEDDING_MODEL);

  return {
    modelName: config.BETTERLOG_EMBEDDING_MODEL,
    async embed(text: string): Promise<number[]> {
      const { embedding } = await embed({ model, value: text });
      return embedding;
    },
  };
}
