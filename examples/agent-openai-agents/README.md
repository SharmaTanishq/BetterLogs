# @betterlog/example-agent-openai-agents

Single-developer demo: a multi-tool research agent built on the [OpenAI
Agents SDK](https://openai.github.io/openai-agents-js/) (`@openai/agents`),
instrumented with `@betterlog/sdk-node` so every tool invocation lands in
BetterLog's Postgres as a `steps` row under one `workflows` row.

Validates SPEC §4 Q11 ("Find similar failures across agent stacks") in
tandem with the sibling [`examples/agent-vercel-ai`](../agent-vercel-ai/),
which uses the Vercel AI SDK (`ai`) instead. Same scenario, same fake
catalogue, same broken SKU, same 5 tools — the only deliberate
distinguishing elements in the data are the `service` field
(`agent-openai-agents` vs `agent-vercel-ai`) and the workflow's `agent`
business key (`openai-agents-research` vs `vercel-ai-research`).

## Prereqs

- pgvector + Postgres up: `pnpm db:up`
- Migrations applied
- API running locally: `pnpm --filter @betterlog/api dev`
- `OPENAI_API_KEY`, `BETTERLOG_API_URL`, `BETTERLOG_API_KEY` in the root `.env`

## Run

```bash
# Failure path (default) — agent will hit the broken inventory subsystem
pnpm --filter @betterlog/example-agent-openai-agents start

# Success path — broken SKU is hidden from the agent
pnpm --filter @betterlog/example-agent-openai-agents start:success
```

## What to expect

- One `workflows` row (`name='agent.run'`, `agent='openai-agents-research'`).
- ~5–10 `steps` rows, one per tool call (`tool.search_products`,
  `tool.fetch_specs`, `tool.fetch_reviews`, `tool.check_inventory`,
  `tool.score_product`).
- On the failure path: `workflows.status='failed'` and ~30s later a row in
  `failure_embeddings` written by the API's background poller.

## Verify

```sql
-- Most recent run from this demo
select id, name, status, business_keys, started_at
from workflows
where business_keys->>'agent' = 'openai-agents-research'
order by started_at desc
limit 1;

-- Steps for that workflow
select name, service, status, error->>'code' as code
from steps
where workflow_id = '<id-from-above>'
order by started_at;
```

Or via the CLI:

```bash
pnpm --filter @betterlog/cli build && \
  node packages/cli/dist/index.js diagnose --workflow-id <id>
```

## Cross-stack query

Running both this demo and `examples/agent-vercel-ai` produces two failed
workflows of similar shape from different agent stacks. The `find_similar_failures`
API endpoint should return both when queried with either as the seed —
that's the SPEC §4 Q11 check.
