/**
 * BYOK LLM model factory.
 *
 * Reads provider + model name from config (which itself reads env vars) and
 * returns a Vercel AI SDK model instance. The diagnose agent doesn't care
 * which provider is behind it — that's the point.
 *
 * Adding another provider: install its `@ai-sdk/*` package and add a branch.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { Config } from "../config.js";

export function createModel(config: Config): LanguageModel {
  switch (config.BETTERLOG_LLM_PROVIDER) {
    case "openai": {
      if (!config.OPENAI_API_KEY) {
        throw new Error(
          "BETTERLOG_LLM_PROVIDER=openai but OPENAI_API_KEY is not set in .env",
        );
      }
      const openai = createOpenAI({ apiKey: config.OPENAI_API_KEY });
      return openai(config.BETTERLOG_LLM_MODEL);
    }
    case "anthropic": {
      if (!config.ANTHROPIC_API_KEY) {
        throw new Error(
          "BETTERLOG_LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set in .env",
        );
      }
      const anthropic = createAnthropic({ apiKey: config.ANTHROPIC_API_KEY });
      return anthropic(config.BETTERLOG_LLM_MODEL);
    }
  }
}
