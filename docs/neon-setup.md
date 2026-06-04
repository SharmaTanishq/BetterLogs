# Neon database setup

BetterLog uses managed Postgres (Neon recommended) with the **pgvector** extension. No schema changes are required — only the connection string.

## Steps

1. Create a [Neon](https://neon.tech) project.
2. Enable the vector extension in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy the connection string and set in `.env`:
   ```bash
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/betterlog?sslmode=require
   ```
4. Run migrations from the repo root:
   ```bash
   pnpm db:migrate
   ```

## Local development

Keep using Docker Compose Postgres for local dev:

```bash
pnpm db:up
# DATABASE_URL=postgresql://betterlog:betterlog@localhost:5433/betterlog
pnpm db:migrate
```

Point production/staging at Neon; local dev at Docker. Same Drizzle schema and queries work on both.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection (Neon or local) |
| `BETTERLOG_API_KEY` | Server-side workspace secret for OTLP + diagnose |
| `BETTERLOG_PUBLISHABLE_API_KEY` | Optional browser-safe ingest-only key for OTLP |

If `BETTERLOG_PUBLISHABLE_API_KEY` is unset, browser SDK ingestion is disabled (401).
