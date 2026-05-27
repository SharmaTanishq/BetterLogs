/**
 * Sibling of examples/agent-vercel-ai/src/index.ts: same scenario, same
 * catalogue, same broken-SKU failure path, but built on the OpenAI Agents
 * SDK (`@openai/agents`) instead of the Vercel AI SDK.
 *
 * The point of running both demos is to prove that a single BetterLog
 * instrumentation pattern — `withWorkflow` at the top, `recordStep`
 * inside every tool — works across agent frameworks. The two demos
 * produce comparable workflow shapes that can be queried side by side
 * in BetterLog's Postgres, which exercises `find_similar_failures`
 * across two failures of similar shape but different agent stacks
 * (SPEC §4 Q11).
 *
 * Failure path: by default `MODE` is unset → `includeBrokenSku=true`,
 * the agent will eventually call `check_inventory` on the broken SKU,
 * the tool throws, the `recordStep` wrapper marks the step failed and
 * pushes into a closure-bound array of failed tool calls. After `run()`
 * resolves we inspect that array and throw if it's non-empty, so the
 * surrounding `withWorkflow` span ends with status ERROR and the row
 * lands in Postgres as `workflows.status = 'failed'` — which is exactly
 * what the API's embedding poller looks for.
 */

import { init, shutdown, withWorkflow } from "@betterlog/sdk-node";
import { Agent, run } from "@openai/agents";
import { ulid } from "ulid";
import { buildTools } from "./tools.js";

const USER_PROMPT =
  "I have a budget of around $1,800 for a laptop primarily for 4K video editing. " +
  "Compare the strongest options in the catalogue, check inventory, and recommend " +
  "one with a brief justification.";

const SYSTEM_INSTRUCTIONS = [
  "You are a hands-on product research assistant for a small online retailer.",
  "Use the provided tools to gather facts before recommending anything.",
  "Typical workflow: search_products → fetch_specs + fetch_reviews on the top 2-3 → check_inventory on the finalists → score_product → recommend.",
  "If a tool errors, briefly note the failure and continue with the remaining candidates.",
  "Keep the final answer short (under 200 words) and call out price, key spec, and stock.",
].join(" ");

async function main(): Promise<void> {
  init({
    serviceName: "agent-openai-agents",
    serviceVersion: "0.0.1",
  });

  const mode = process.env.MODE ?? "fail";
  const includeBrokenSku = mode !== "success";
  const runId = ulid();

  try {
    await withWorkflow(
      {
        name: "agent.run",
        version: "0.0.1",
        environment: "development",
        businessKeys: {
          run_id: runId,
          agent: "openai-agents-research",
        },
        metadata: { source: "agent-openai-agents", mode },
      },
      async ({ workflowId }) => {
        console.log(`Starting agent workflow ${workflowId} (run_id=${runId}, mode=${mode})`);

        const { tools, failedToolCalls } = buildTools({ includeBrokenSku });

        const agent = new Agent({

          name: "research-agent",
          instructions: SYSTEM_INSTRUCTIONS,
          model: "gpt-5-mini",
          tools: [...tools],
        });

        const result = await run(agent, USER_PROMPT, { maxTurns: 12 });

        // newItems carries one entry per tool call (RunToolCallItem) and one
        // per tool output (RunToolCallOutputItem). Tools that errored are
        // visible only as a "An error occurred while running the tool..."
        // string in the output item — we use our own failedToolCalls list
        // for a structured view instead of string-sniffing.
        const toolCallCount = result.newItems.filter(
          (item) => item.type === "tool_call_item",
        ).length;
        const turnCount = result.rawResponses.length;

        console.log("---");
        console.log(`run_id:      ${runId}`);
        console.log(`workflow_id: ${workflowId}`);
        console.log(`mode:        ${mode}`);
        console.log(`turns:       ${turnCount}`);
        console.log(`tool_calls:  ${toolCallCount}`);
        console.log(`failed:      ${failedToolCalls.length}`);
        if (failedToolCalls.length > 0) {
          console.log("failed_tool_calls:");
          for (const f of failedToolCalls) {
            console.log(`  - ${f.name}${f.code ? ` [${f.code}]` : ""}: ${f.message}`);
          }
        }
        console.log("---");
        console.log("final_output:");
        console.log(result.finalOutput ?? "<no final output>");
        console.log("---");

        if (failedToolCalls.length > 0) {
          // Surface the first failure as the workflow-level error. withWorkflow
          // will record this on the root span as status=ERROR, which the API's
          // OTLP parser maps to workflows.status = 'failed' (otlp-parse.ts L82-86),
          // which in turn makes the failure-embedding poller pick this run up.
          const first = failedToolCalls[0]!;
          throw new AgentRunFailedError(
            `Agent run failed: ${failedToolCalls.length} tool call(s) errored; ` +
              `first=${first.name}${first.code ? ` [${first.code}]` : ""} — ${first.message}`,
            failedToolCalls,
          );
        }
      },
    );
  } finally {
    // Flush spans even when the workflow throws.
    await shutdown();
  }
}

class AgentRunFailedError extends Error {
  constructor(
    message: string,
    public readonly failedToolCalls: ReadonlyArray<{ name: string; message: string; code?: string }>,
  ) {
    super(message);
    this.name = "AgentRunFailedError";
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
