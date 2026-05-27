/**
 * Agent tools, each one wrapped in `recordStep` so every invocation
 * shows up as a `steps` row in BetterLog.
 *
 * The wrapping is the entire point of this example: the agent framework
 * (Vercel AI SDK) doesn't know anything about BetterLog — we just call
 * `recordStep(...)` inside each tool's `execute` callback. The active
 * workflow span set up by `withWorkflow` is propagated automatically
 * via OpenTelemetry context, so each step nests under the workflow.
 *
 * Tool names use a `tool.<name>` convention so they're easy to spot in
 * the workflow timeline alongside non-tool steps like `agent.plan`.
 */

import { recordStep } from "@betterlog/sdk-node";
import { tool } from "ai";
import { z } from "zod";
import {
  getInventory,
  getProductBySku,
  getReviewsForSku,
  searchProducts,
  type Product,
  type Review,
} from "./catalogue.js";

const SERVICE = "agent-vercel-ai";

export interface BuildToolsOptions {
  /** Whether the broken SKU is visible to search_products. Default true. */
  includeBrokenSku: boolean;
}

export function buildTools(opts: BuildToolsOptions) {
  const { includeBrokenSku } = opts;

  return {
    search_products: tool({
      description:
        "Search the product catalogue for laptops matching a free-form query " +
        "(e.g. 'video editing', 'gaming', 'lightweight ultrabook'). Returns up to 4 candidates.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Free-form product search query"),
      }),
      execute: async ({ query }) =>
        recordStep(
          { name: "tool.search_products", service: SERVICE, input: { query } },
          async (): Promise<{ count: number; products: Product[] }> => {
            const products = searchProducts(query, includeBrokenSku);
            return { count: products.length, products };
          },
        ),
    }),

    fetch_specs: tool({
      description:
        "Fetch the full specification sheet (cpu, ram, storage, gpu, weight, price) for a single SKU.",
      inputSchema: z.object({
        sku: z.string().describe("Product SKU returned by search_products"),
      }),
      execute: async ({ sku }) =>
        recordStep(
          { name: "tool.fetch_specs", service: SERVICE, input: { sku } },
          async (): Promise<{ found: boolean; product: Product | null }> => {
            const product = getProductBySku(sku);
            if (!product) return { found: false, product: null };
            return { found: true, product };
          },
        ),
    }),

    fetch_reviews: tool({
      description:
        "Fetch independent reviews for a single SKU. Returns rating + excerpt per review.",
      inputSchema: z.object({
        sku: z.string().describe("Product SKU"),
      }),
      execute: async ({ sku }) =>
        recordStep(
          { name: "tool.fetch_reviews", service: SERVICE, input: { sku } },
          async (): Promise<{ sku: string; count: number; reviews: Review[] }> => {
            const reviews = getReviewsForSku(sku);
            return { sku, count: reviews.length, reviews };
          },
        ),
    }),

    check_inventory: tool({
      description:
        "Check live inventory for a single SKU. Returns the number of units in stock. " +
        "May throw INVENTORY_LOOKUP_FAILED for SKUs whose upstream inventory subsystem is down.",
      inputSchema: z.object({
        sku: z.string().describe("Product SKU"),
      }),
      execute: async ({ sku }) =>
        recordStep(
          { name: "tool.check_inventory", service: SERVICE, input: { sku } },
          async (): Promise<{ sku: string; stock: number }> => {
            const stock = getInventory(sku);
            return { sku, stock };
          },
        ),
    }),

    score_product: tool({
      description:
        "Compute a 0–10 fitness score for a SKU given a use case description, the product's specs, " +
        "and its reviews. Use this *after* fetching specs and reviews for a SKU.",
      inputSchema: z.object({
        sku: z.string(),
        use_case: z.string().describe("E.g. 'video editing', 'long battery life', 'mobile gaming'"),
        priorities: z
          .array(z.string())
          .min(1)
          .describe("Ordered list of priorities, e.g. ['gpu', 'ram', 'price']"),
      }),
      execute: async ({ sku, use_case, priorities }) =>
        recordStep(
          {
            name: "tool.score_product",
            service: SERVICE,
            input: { sku, use_case, priorities },
          },
          async (): Promise<{
            sku: string;
            score: number;
            rationale: string;
          }> => {
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
  } as const;
}
