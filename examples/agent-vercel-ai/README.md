# `@betterlog/example-agent-vercel-ai`

Single-developer agent demo: a multi-tool research agent built with the
[Vercel AI SDK](https://ai-sdk.dev) (`generateText` + `stepCountIs`) and
instrumented with `@betterlog/sdk-node`. Every tool call lands as a `steps`
row in BetterLog's Postgres, nested under one `agent.run` workflow. Validates
[SPEC.md §4 Q11](../../SPEC.md) — _"Why did agent run `abc123` fail at the
search tool?"_ — end-to-end in a single process.

A sibling example, `examples/agent-openai-agents/`, exercises the same
scenario with the OpenAI Agents SDK.

## Prerequisites

1. Postgres + pgvector up: `pnpm db:up` from the repo root.
2. Schema migrated: `pnpm db:migrate`.
3. API running locally: `pnpm --filter @betterlog/api dev`.
4. `.env` at the repo root has `OPENAI_API_KEY=sk-...` set — both this agent
   (its LLM) and the API (its failure-embedder) read it.

`BETTERLOG_API_URL` and `BETTERLOG_API_KEY` default to the dev values in
`.env.example`; no extra config needed.

## Run it

```bash
# Default: fails on purpose (check_inventory throws on the broken SKU).
pnpm --filter @betterlog/example-agent-vercel-ai start

# Happy path: same tool chain, broken SKU hidden from search results.
pnpm --filter @betterlog/example-agent-vercel-ai start:success
```

## What to expect

- The agent prints its `workflow_id`, `run_id`, the tool-call chain it took,
  and the final recommendation text.
- In the API logs you'll see one `POST /v1/otlp/traces` (one workflow span +
  N step spans) and, on a fail run, the embedding poller logging
  `failure-embedding tick … embedded=1` within ~30s.
- In Postgres:

```sql
SELECT id, name, status, started_at FROM workflows ORDER BY started_at DESC LIMIT 3;
SELECT workflow_id, summary FROM failure_embeddings ORDER BY workflow_id DESC LIMIT 3;
```

The fail run shows `status='failed'` and a matching `failure_embeddings` row.
The success run shows `status='success'` and no embedding row.

## Diagnose the failure

Once the failure embedding lands, ask the CLI about it:

```bash
betterlog diagnose "What happened to agent run <run_id>?" --workflow-id <workflow_id>
```

The agent prints both IDs at the start of the run; paste them in.
