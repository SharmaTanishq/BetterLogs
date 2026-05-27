/**
 * Agent tools, each one wrapped in `recordStep` so every invocation
 * shows up as a `steps` row in BetterLog.
 *
 * The wrapping is the entire point of this example: the agent framework
 * (OpenAI Agents SDK) doesn't know anything about BetterLog — we just call
 * `recordStep(...)` inside each tool's `execute` callback. The active
 * workflow span set up by `withWorkflow` is propagated automatically
 * via OpenTelemetry context, so each step nests under the workflow.
 *
 * Why a closure-bound `failedToolCalls` array: by default `@openai/agents`
 * catches any throw out of a tool's `execute`, runs it through its built-in
 * error formatter, and feeds the error string back to the model so it can
 * recover. That's good agent UX but it means `run()` never throws and the
 * RunResult exposes no first-class "this tool errored" field — the failure
 * is just a string in newItems. To mark our enclosing workflow as failed,
 * we record each tool error in a closure-bound array, re-throw so the
 * agent still sees the error, and let index.ts inspect the array after
 * `run()` returns.
 */

import { recordStep } from "@betterlog/sdk-node";
import { tool } from "@openai/agents";
import { z } from "zod";
import {
  getInventory,
  getProductBySku,
  getReviewsForSku,
  searchProducts,
  type Product,
  type Review,
} from "./catalogue.js";

const SERVICE = "agent-openai-agents";

export interface BuildToolsOptions {
  /** Whether the broken SKU is visible to search_products. Default true. */
  includeBrokenSku: boolean;
}

export interface FailedToolCall {
  name: string;
  message: string;
  code?: string;
}

export interface BuiltTools {
  tools: ReturnType<typeof buildToolList>;
  failedToolCalls: FailedToolCall[];
}

export function buildTools(opts: BuildToolsOptions): BuiltTools {
  const failedToolCalls: FailedToolCall[] = [];
  const tools = buildToolList(opts, failedToolCalls);
  return { tools, failedToolCalls };
}

function buildToolList(opts: BuildToolsOptions, failedToolCalls: FailedToolCall[]) {
  const { includeBrokenSku } = opts;

  // Wraps recordStep so every tool error is also pushed into the shared
  // failedToolCalls array before being re-thrown. The agent's default error
  // handler still receives the throw and feeds the model an error message;
  // we just get a second copy that the surrounding workflow can inspect.
  function trackingStep<T>(
    name: string,
    input: unknown,
    body: () => Promise<T>,
  ): Promise<T> {
    return recordStep({ name, service: SERVICE, input }, body).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: unknown }).code)
          : undefined;
      failedToolCalls.push({ name, message, code });
      throw err;
    });
  }

  return [
    tool({
      name: "search_products",
      description:
        "Search the product catalogue for laptops matching a free-form query " +
        "(e.g. 'video editing', 'gaming', 'lightweight ultrabook'). Returns up to 4 candidates.",
      parameters: z.object({
        query: z.string().min(1).describe("Free-form product search query"),
      }),
      execute: async ({ query }) =>
        trackingStep(
          "tool.search_products",
          { query },
          async (): Promise<{ count: number; products: Product[] }> => {
            const products = searchProducts(query, includeBrokenSku);
            return { count: products.length, products };
          },
        ),
    }),

    tool({
      name: "fetch_specs",
      description:
        "Fetch the full specification sheet (cpu, ram, storage, gpu, weight, price) for a single SKU.",
      parameters: z.object({
        sku: z.string().describe("Product SKU returned by search_products"),
      }),
      execute: async ({ sku }) =>
        trackingStep(
          "tool.fetch_specs",
          { sku },
          async (): Promise<{ found: boolean; product: Product | null }> => {
            const product = getProductBySku(sku);
            if (!product) return { found: false, product: null };
            return { found: true, product };
          },
        ),
    }),

    tool({
      name: "fetch_reviews",
      description:
        "Fetch independent reviews for a single SKU. Returns rating + excerpt per review.",
      parameters: z.object({
        sku: z.string().describe("Product SKU"),
      }),
      execute: async ({ sku }) =>
        trackingStep(
          "tool.fetch_reviews",
          { sku },
          async (): Promise<{ sku: string; count: number; reviews: Review[] }> => {
            const reviews = getReviewsForSku(sku);
            return { sku, count: reviews.length, reviews };
          },
        ),
    }),

    tool({
      name: "check_inventory",
      description:
        "Check live inventory for a single SKU. Returns the number of units in stock. " +
        "May throw INVENTORY_LOOKUP_FAILED for SKUs whose upstream inventory subsystem is down.",
      parameters: z.object({
        sku: z.string().describe("Product SKU"),
      }),
      execute: async ({ sku }) =>
        trackingStep(
          "tool.check_inventory",
          { sku },
          async (): Promise<{ sku: string; stock: number }> => {
            const stock = getInventory(sku);
            return { sku, stock };
          },
        ),
    }),

    tool({
      name: "score_product",
      description:
        "Compute a 0–10 fitness score for a SKU given a use case description, the product's specs, " +
        "and its reviews. Use this *after* fetching specs and reviews for a SKU.",
      parameters: z.object({
        sku: z.string(),
        use_case: z.string().describe("E.g. 'video editing', 'long battery life', 'mobile gaming'"),
        priorities: z
          .array(z.string())
          .min(1)
          .describe("Ordered list of priorities, e.g. ['gpu', 'ram', 'price']"),
      }),
      execute: async ({ sku, use_case, priorities }) =>
        trackingStep(
          "tool.score_product",
          { sku, use_case, priorities },
          async (): Promise<{ sku: string; score: number; rationale: string }> => {
            const product = getProductBySku(sku);
            if (!product) {
              throw new Error(`score_product: unknown sku ${sku}`);
            }
            const reviews = getReviewsForSku(sku);
            const reviewMean =
              reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.ratingOutOfTen, 0) / reviews.length
                : 6.5;

            let priorityBoost = 0;
            for (const p of priorities) {
              const norm = p.toLowerCase();
              if (norm.includes("gpu") && /rtx|m3 pro|m3 max|arc/i.test(product.gpu)) priorityBoost += 0.4;
              if (norm.includes("ram") && product.ramGb >= 32) priorityBoost += 0.3;
              if (norm.includes("price") && product.priceCents <= 175_000) priorityBoost += 0.4;
              if (norm.includes("weight") && product.weightKg <= 1.8) priorityBoost += 0.3;
            }

            const useCaseBoost = /video|editing|render|color/i.test(use_case)
              ? product.ramGb >= 32
                ? 0.4
                : -0.2
              : 0;

            const raw = reviewMean + priorityBoost + useCaseBoost;
            const score = Math.max(0, Math.min(10, Number(raw.toFixed(2))));

            return {
              sku,
              score,
              rationale:
                `review_mean=${reviewMean.toFixed(2)}, priority_boost=${priorityBoost.toFixed(2)}, ` +
                `use_case_boost=${useCaseBoost.toFixed(2)}; final=${score}`,
            };
          },
        ),
    }),
  ] as const;
}
