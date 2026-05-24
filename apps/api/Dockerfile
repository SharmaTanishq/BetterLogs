# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the @betterlog/api package.
#
# Build context is the REPO ROOT, not apps/api. Build it with:
#   docker build -f apps/api/Dockerfile -t betterlog-api .
#
# Stage 1 installs all workspace deps + builds shared and api.
# Stage 2 uses `pnpm deploy` to flatten the api package + its workspace
# deps into a self-contained tree, then copies that into a clean image.

ARG NODE_VERSION=22
ARG PNPM_VERSION=10.33.0

# === builder ==================================================================
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /repo

ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Lockfile + workspace metadata first (better layer caching).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Now the source.
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared first (api depends on its dist).
RUN pnpm --filter @betterlog/shared build
RUN pnpm --filter @betterlog/api build

# Produce a self-contained deploy folder with prod deps only.
# `--legacy` keeps pnpm v9 behaviour (no inject-workspace-packages requirement).
RUN pnpm --filter=@betterlog/api deploy --prod --legacy /deploy

# === runner ===================================================================
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000

# pnpm deploy gives us node_modules + package.json + the api's compiled dist.
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/package.json  ./package.json
COPY --from=builder /deploy/dist          ./dist

# Drizzle migration SQL files (read at runtime by db/migrate.js).
COPY --from=builder /repo/apps/api/drizzle ./drizzle

EXPOSE 4000

# Run as the unprivileged `node` user that comes with the official image.
RUN chown -R node:node /app
USER node

CMD ["node", "dist/index.js"]
