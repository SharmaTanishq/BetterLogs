/**
 * Single-developer agent demo (Vercel AI SDK) instrumented with BetterLog.
 *
 * The headline scenario is SPEC.md §4 Q11: "Why did agent run abc123 fail at
 * the search tool?" — one process, many tool calls, one of them deterministically
 * broken. This file is the glue: it boots the SDK, opens one `agent.run`
 * workflow, runs `generateText` with `buildTools(...)`, and (in the default
 * MODE=fail) re-throws after inspecting `result.steps` so the workflow span
 * lands in Postgres as `status='failed'` — without that throw, the AI SDK
 * swallows tool errors into `content: { type: 'tool-error' }`, the workflow
 * span stays OK, and the failure-embedding poller (which filters on
 * `workflows.status = 'failed'`) never picks the run up.
 *
 * Run with `pnpm --filter @betterlog/example-agent-vercel-ai start`
 * (fail mode, default) or `start:success` to exercise the happy path with the
 * broken SKU hidden from search results.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { init, shutdown, withWorkflow } from "@betterlog/sdk-node";
import { generateText, stepCountIs } from "ai";
import { ulid } from "ulid";
import { buildTools } from "./tools.js";

const SERVICE_NAME = "agent-vercel-ai";
const SERVICE_VERSION = "0.0.1";
const MAX_STEPS = 12;

const SYSTEM_PROMPT = `You are a product research agent that recommends laptops.

Follow this loop, in order:
1. Call search_products once with a query derived from the user's use case.
2. For the 2-3 strongest candidates, call fetch_specs and fetch_reviews.
3. Before recommending any SKU, call check_inventory to confirm stock. Do not skip this — a recommendation for an unavailable laptop is wrong even if it scores well.
4. Call score_product for each candidate you are still considering.
5. Output one final recommendation with a one-paragraph justification citing score, specs, reviews, and current stock.

Keep tool inputs minimal and avoid redundant calls.`;

const USER_PROMPT =
  "I have a budget of around $1,800 for a laptop primarily for 4K video editing. " +
  "Compare the strongest options in the catalogue, check inventory, and recommend one " +
  "with a brief justification.";

async function main(): Promise<void> {
  init({ serviceName: SERVICE_NAME, serviceVersion: SERVICE_VERSION });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required (set it in the repo root .env).");
  }

  const mode = process.env.MODE === "success" ? "success" : "fail";
  const runId = ulid();

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = openai("gpt-5-mini");

  try {
    await withWorkflow(
      {
        name: "agent.run",
        version: SERVICE_VERSION,
        environment: "development",
        businessKeys: {
          run_id: runId,
          agent: "vercel-ai-research",
        },
        metadata: { mode, framework: "vercel-ai-sdk" },
      },
      async ({ workflowId }) => {
        console.log(
          `[${SERVICE_NAME}] starting workflow_id=${workflowId} run_id=${runId} mode=${mode}`,
        );

        const tools = buildTools({ includeBrokenSku: mode !== "success" });

        const result = await generateText({
          model,
          system: SYSTEM_PROMPT,
          prompt: USER_PROMPT,
          tools,
          stopWhen: stepCountIs(MAX_STEPS),
        });

        const toolCallNames: string[] = [];
        const toolErrors: Array<{ toolName: string; error: unknown }> = [];
        for (const step of result.steps) {
          for (const call of step.toolCalls ?? []) {
            toolCallNames.push(call.toolName);
          }
          // Vercel AI SDK v6 surfaces thrown tool errors as content parts of
          // type "tool-error" rather than as entries in `toolResults`.
          for (const part of step.content ?? []) {
            if (part.type === "tool-error") {
              toolErrors.push({ toolName: part.toolName, error: part.error });
            }
          }
        }

        console.log(
          `[${SERVICE_NAME}] summary workflow_id=${workflowId} run_id=${runId} ` +
            `finish_reason=${result.finishReason} step_count=${result.steps.length} ` +
            `tool_calls=[${toolCallNames.join(", ")}] tool_errors=${toolErrors.length}`,
        );
        console.log(`\n[${SERVICE_NAME}] final answer:\n${result.text}\n`);

        if (toolErrors.length > 0) {
          const first = toolErrors[0]!;
          const detail =
            first.error instanceof Error ? first.error.message : String(first.error);
          throw new AgentToolFailure(
            `agent.run failed: tool ${first.toolName} returned an error (${detail}). ` +
              `Total tool errors in this run: ${toolErrors.length}.`,
            first.toolName,
            toolErrors.length,
          );
        }
      },
    );
  } finally {
    // BatchSpanProcessor only flushes on shutdown — without this the workflow
    // and step spans never reach the API and the rest of the demo is silent.
    await shutdown();
  }
}

class AgentToolFailure extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly toolErrorCount: number,
  ) {
    super(message);
    this.name = "AgentToolFailure";
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
