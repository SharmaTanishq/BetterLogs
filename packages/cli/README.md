# @betterlog/cli

Thin CLI for the BetterLog diagnose API. One command for MVP.

## Install

```bash
# tarball (preferred until we publish to npm)
npm install -g ./betterlog-cli-0.1.0.tgz

# or run via pnpm without installing globally
pnpm --filter @betterlog/cli start diagnose "..."
```

## Use

```bash
export BETTERLOG_API_URL=https://betterlog-api.fly.dev
export BETTERLOG_API_KEY=blg_...

betterlog diagnose "Have we seen failures like this before?"
betterlog diagnose "What happened to order #1234?" --workflow-id wf_01HXY...
```

Flags:

- `--workflow-id <id>` — pin the agent to a specific workflow ulid (skips business-key lookup).
- `--api-url <url>` — overrides `BETTERLOG_API_URL`. Default: `https://betterlog-api.fly.dev`.
- `--api-key <key>` — overrides `BETTERLOG_API_KEY`. Required if env unset.

## Output

The CLI prints:

1. The agent's answer (bolded, wrapped at ~100 cols).
2. The list of tool calls it made, one line per call.
3. Step count + finish reason.

Exit codes: `0` success, `1` runtime/network/API error, `2` bad CLI usage.
