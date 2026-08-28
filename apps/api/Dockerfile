# syntax=docker/dockerfile:1
# ============================================
# WHAT THIS FILE DOES (plain English):
# The recipe that packages ONLY the Bridger API (NestJS) into a small, runnable
# container. AWS App Runner runs this container. Because our code lives in one
# big repo with several projects, we use Turborepo's "prune" to grab just the API
# plus the shared code it needs (not the mobile app), keeping the image small.
#
# It builds in stages so the final image is tiny:
#   1) prune    - work out the minimal set of files the API needs
#   2) install  - install just those dependencies (cached on the lockfile)
#   3) build    - compile the shared package + the API to plain JavaScript
#   4) runner   - a clean, production-only image that just runs the server
# ============================================

ARG NODE_VERSION=20

# --- Stage 1: prune the monorepo down to the API and its dependencies ---
FROM node:${NODE_VERSION}-slim AS pruner
WORKDIR /repo
RUN corepack enable
COPY . .
# Produces /repo/out with only @bridger/api + its workspace deps (and a pruned lockfile).
RUN pnpm dlx turbo@^2 prune @bridger/api --docker

# --- Stage 2: install dependencies (this layer is cached unless deps change) ---
FROM node:${NODE_VERSION}-slim AS installer
WORKDIR /repo
RUN corepack enable
# Copy just the package manifests + lockfile first, so Docker can cache installs.
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# --- Stage 3: bring in the source and build the API ---
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /repo
RUN corepack enable
COPY --from=installer /repo/ ./
COPY --from=pruner /repo/out/full/ ./
# The package tsconfigs extend the repo-root base config, which turbo prune does
# not copy into out/full, so bring it in explicitly or tsc cannot find it.
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
# Shared types + AI gateway must be compiled before the API that imports them.
RUN pnpm --filter @bridger/shared build \
  && pnpm --filter @bridger/ai build \
  && pnpm --filter @bridger/api build
# Create a self-contained, production-only folder for the API at /app.
# --legacy: pnpm v10 wants injected workspace packages; our prune layout still
# uses the classic deploy path.
RUN pnpm --filter @bridger/api deploy --prod --legacy /app

# --- Stage 4: the tiny image that actually runs in production ---
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# ImageMagick powers the server-side photo looks (e.g. the Comic profile filter).
# Installed as root before we drop to the non-root user below.
RUN apt-get update \
  && apt-get install -y --no-install-recommends imagemagick \
  && rm -rf /var/lib/apt/lists/*
# Run as the built-in non-root "node" user for safety.
COPY --from=builder --chown=node:node /app ./
USER node
# App Runner sends traffic to this port (also passed in as the PORT env var).
EXPOSE 3000
CMD ["node", "dist/main.js"]
