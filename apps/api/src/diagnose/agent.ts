/**
 * Single-agent diagnose loop.
 *
 * Per SPEC.md §5 "Single-agent diagnosis loop": one agent, many tools, no
 * multi-agent orchestration, no recursion or planning loops. The model
 * picks tools, when to stop, what to conclude.
 *
 * Vercel AI SDK's generateText with `stopWhen: stepCountIs(N)` gives us
 * exactly that — the model can call tools repeatedly up to a hard cap, then
 * is forced to emit a final text answer.
 */

import { generateText, stepCountIs, type LanguageModel } from "ai";
import type { Db } from "../db/client.js";
import type { Embedder } from "../embeddings/embed.js";
import { buildTools } from "./tools.js";

const MAX_STEPS = 8;

const SYSTEM_PROMPT = `You are BetterLog's diagnose agent. Your job is to answer engineering questions about workflows running across distributed services, using the tools provided.

You have access to tools that let you fetch workflows, list recent failures, pull step payloads, read pipeline stats, and find semantically-similar past failures. You should:

1. Use tools to gather evidence before answering. Do not guess.
2. When a question mentions a human-readable id (like "order #1234"), use find_workflow_by_business_key first.
3. Once you have a workflow_id, call get_workflow for the full timeline.
4. For pattern/health questions, use search_recent_failures or get_pipeline_stats.
5. When diagnosing a specific failure, also consider calling find_similar_failures to check whether this kind of failure has happened before — pass the workflow_id, or a short query_text describing the failure shape.
6. Cite specific evidence: workflow_ids, step names, error codes, timestamps. Quote error messages verbatim when relevant.
7. When you don't have enough data to answer, say so explicitly rather than inventing details.

Format your final answer for a software engineer reading it in a terminal:
- Lead with the bottom-line answer in one sentence.
- Then bullet the supporting evidence (which steps, which errors, which timestamps).
- End with a suggested next step if applicable.

Keep responses tight. No filler.`;

export interface DiagnoseInput {
  question: string;
  workflow_id?: string;
}

export interface DiagnoseResult {
  answer: string;
  tool_calls: Array<{ tool: string; input: unknown; output: unknown }>;
  step_count: number;
  finish_reason: string;
}

export interface DiagnoseDeps {
  db: Db;
  embedder?: Embedder;
}

export async function diagnose(
  model: LanguageModel,
  deps: DiagnoseDeps,
  input: DiagnoseInput,
): Promise<DiagnoseResult> {
  const tools = buildTools({ db: deps.db, embedder: deps.embedder });

  const userPrompt = input.workflow_id
    ? `Question: ${input.question}\n\nContext: workflow_id=${input.workflow_id} is already known — start with get_workflow.`
    : `Question: ${input.question}`;

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
  });

  const toolCalls: DiagnoseResult["tool_calls"] = [];
  for (const step of result.steps) {
    const calls = step.toolCalls ?? [];
    const results = step.toolResults ?? [];
    for (let i = 0; i < calls.length; i += 1) {
      const call = calls[i];
      const out = results[i];
      if (!call) continue;
      toolCalls.push({
        tool: call.toolName,
        input: call.input,
        output: out?.output,
      });
    }
  }

  return {
    answer: result.text,
    tool_calls: toolCalls,
    step_count: result.steps.length,
    finish_reason: result.finishReason,
  };
}
