# Diagnosis Loop

> **Status:** TODO — stub. Will be filled in during MVP week 2-3 alongside diagnosis API implementation.

The diagnosis loop is where BetterLog earns its keep. The MVP architecture is deliberately simple: one agent, a fixed set of query tools, single-shot reasoning. No multi-agent orchestration, no per-service agents, no planning loops.

## Planned contents

- The single-agent design: model choice, system prompt, output schema, structured response format.
- Full tool catalog with signatures, when each tool fires, and the data each returns.
- Context-window strategy: how to handle workflows with hundreds of steps (truncation, hierarchical summarization, step-level retrieval).
- Prompt engineering principles: how the agent is instructed to cite evidence, when to say "I don't know," how to format suggested actions.
- The evaluation harness: how we replay historical incidents, score answers, and track accuracy regressions.
- Latency budget: target <30s p50 for `/diagnose`, where the time goes, optimization strategy.
- BYOK plumbing: how customer-provided OpenAI / Anthropic / Ollama keys flow through without ever being persisted.
- Cost estimation per diagnosis at different model tiers.

## Decisions to record here as they happen

- Default model choice (probably Claude Sonnet or GPT-5 mid-tier for cost/quality balance).
- Whether the agent uses native tool calling or function calling JSON.
- Failure-signature embedding strategy for `find_similar_failures` (what gets embedded, when).
- Whether to expose a "show me your reasoning" mode for debugging trust issues.
- How remediation-capture from the `betterlog resolve` CLI command feeds back into the diagnosis corpus.
