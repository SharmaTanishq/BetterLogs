# Deploy

**Status:** First deploy walkthrough. Stays valid while we're on Neon + Fly (per `build-plan.md` §6).
**Audience:** Tanishq (solo). The 4 steps under "Your part" are the ones that require your hands; everything else is driven by me from this chat once those are done.

This deploys `apps/api` (the Fastify service: ingestion + diagnose) to Fly.io, backed by a managed Neon Postgres.

The repo is already set up — Dockerfile, fly.toml, release_command for migrations all in place. What follows is just the one-time account + secrets dance.

---

## Architecture (deployed)

```
Wilco services (Node + @betterlog/sdk-node)
        │
        │  OTLP/HTTP   POST https://betterlog-api.fly.dev/v1/otlp/traces
        │  Authorization: Bearer <BETTERLOG_API_KEY>
        ▼
┌──────────────────────────────────────────┐
│ betterlog-api  (Fly.io, region bom)      │
│  Fastify + Drizzle + Vercel AI SDK       │
└──────────────┬───────────────────────────┘
               │ DATABASE_URL (pooled)
               ▼
        Neon Postgres + pgvector
               ▲
               │ HTTPS
        curl / @betterlog/cli  (your laptop)
```

---

## Your part (one-time, ~10 minutes)

### 1. Create the Neon project

1. Sign up / log in at https://console.neon.tech.
2. Create a new project: `betterlog-mvp`.
3. **Region:** `Asia Pacific (Singapore)` — closest to Fly's `bom`. (If Q5 from [`week-0-investigation.md`](./week-0-investigation.md) lands on a different region for Wilco, we revisit.)
4. Once the project is up, open the SQL Editor and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Copy the **pooled connection string** from the Neon dashboard. It looks like:
   ```
   postgresql://neondb_owner:<password>@ep-xxxxxxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   You'll paste this into Fly's secret store in step 4 — never put it in `.env` (which is for local Postgres) or anywhere committed.

### 2. Install + auth Fly.io

```bash
# install (macOS)
brew install flyctl

# log in (opens browser, one-time)
flyctl auth login
```

### 3. Create the Fly app

```bash
flyctl apps create betterlog-api
```

If `betterlog-api` is taken globally on Fly, pick another name (e.g. `betterlog-api-<your-initials>`) and update the `app = ...` line in `apps/api/fly.toml` to match.

### 4. Set production secrets

```bash
flyctl secrets set \
  -a betterlog-api \
  DATABASE_URL='postgresql://...your-neon-pooled-url...?sslmode=require' \
  BETTERLOG_API_KEY="$(openssl rand -hex 24 | awk '{print "blg_"$0}')" \
  OPENAI_API_KEY='sk-proj-...your-openai-key...' \
  BETTERLOG_LLM_PROVIDER=openai \
  BETTERLOG_LLM_MODEL=gpt-4o-mini
```

Notes:
- The `BETTERLOG_API_KEY` is the workspace API key the SDK + CLI present in the `Authorization: Bearer` header. The shell snippet above generates one for you (`blg_` + 48 hex chars). Save it somewhere — you'll need it to instrument Wilco services and to hit `/v1/diagnose`.
- `OPENAI_API_KEY` is the same one you put in your local `.env`.
- Don't quote-escape secrets containing `$` — wrap them in single quotes.

### 5. Tell me you're done

Reply with:
- Confirmation that all 4 steps above ran cleanly.
- The generated `BETTERLOG_API_KEY` if you want me to use it locally too. (Or keep it Fly-only; I can read it back via `flyctl secrets list` — only key names are visible, not values, but that's enough to confirm it's set.)

---

## My part (after you say "done")

I'll run, from the repo root:

```bash
flyctl deploy . -c apps/api/fly.toml --remote-only
```

(The leading `.` is the build context — required because the Dockerfile `COPY`s files from the monorepo root, not from `apps/api/`. flyctl resolves the `[build] dockerfile` path in `fly.toml` relative to the fly.toml itself, so the value there is just `"Dockerfile"`.)

That:
1. Ships the build context to Fly's remote builder.
2. Builds the multi-stage Dockerfile (~1–2 min cold, faster after the first deploy thanks to layer cache).
3. Runs the `release_command` (`node dist/db/migrate.js`) against Neon — applies `drizzle/0000_init.sql`, creates the 5 tables and 12 indexes.
4. Starts the API on the public URL `https://betterlog-api.fly.dev`.

Smoke tests I'll run:

```bash
curl https://betterlog-api.fly.dev/health
# expects {"status":"ok","db":"ok","version":"0.0.0"}

curl -X POST https://betterlog-api.fly.dev/v1/diagnose \
  -H "Authorization: Bearer <BETTERLOG_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"question":"Is the order.fulfillment pipeline healthy?"}'
# expects an answer noting zero workflows yet (DB is empty)
```

---

## After first deploy: instrument a real Wilco service

This is the unblock — once `https://betterlog-api.fly.dev` is live, pointing a real Wilco service at it is one config block:

```typescript
import { init, withWorkflow, recordStep } from "@betterlog/sdk-node";

init({
  serviceName: "ecom-middleware",
  apiUrl: "https://betterlog-api.fly.dev",
  apiKey: process.env.BETTERLOG_API_KEY!, // the one from `flyctl secrets set`
});
```

The SDK isn't published to npm yet (that's Week 4 in `build-plan.md` §7). For now, the fastest path for Wilco services to consume it is either:

- **Tarball install** — `pnpm pack` the `@betterlog/sdk-node` package, copy the tarball into the Wilco repo, `pnpm add ./betterlog-sdk-node-0.0.0.tgz`.
- **Git URL install** — `pnpm add github:tanishq/betterlog#main --filter @betterlog/sdk-node` once the repo is on GitHub.

Q9 in `week-0-investigation.md` is exactly this distribution decision. We can defer the npm publish until you know how Wilco wants to consume it.

---

## Cost expectations at this scale

Aligns with `build-plan.md` §8:
- Fly `shared-cpu-1x`/512MB with `min_machines_running=1`: ~$5–10/month.
- Neon free tier: $0 until you exceed the storage/compute caps (~3 GB storage, 191.9 hours compute).
- OpenAI `gpt-4o-mini` + `text-embedding-3-small`: <$10/month at MVP traffic (~50 diagnose/day).

**Total: ~$15/month while validating.**

---

## Rollback

```bash
flyctl releases -a betterlog-api               # list recent releases
flyctl deploy --image registry.fly.io/...      # redeploy a previous image
```

Schema rollback is not automatic — Drizzle is forward-only. For MVP this is fine; we'll add a `drizzle-kit drop` recipe if/when a migration needs to be reversed.
