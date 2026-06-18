FROM oven/bun:1.2 AS base

WORKDIR /app

# 1. Install system dependencies first (rarely change)
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

# 2. Copy root package files
COPY package.json bun.lock ./

# 3. Copy all workspace member package.json files for dependency resolution
COPY apps/api/package.json apps/api/
COPY apps/client/package.json apps/client/
COPY apps/worker/package.json apps/worker/

COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/config/tailwind/package.json packages/config/tailwind/
COPY packages/email/package.json packages/email/
COPY packages/event-sdk/package.json packages/event-sdk/
COPY packages/models/package.json packages/models/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/

# 4. Install dependencies (cached unless package.json files change)
RUN bun install --ignore-scripts

# 5. Copy the rest of the monorepo code
COPY . .

# 6. Generate Prisma Client (Bypass SSL for binary download if needed)
RUN cd apps/api && NODE_TLS_REJECT_UNAUTHORIZED=0 bunx prisma generate

# Stage: API
FROM base AS api
EXPOSE 3005
CMD ["sh", "-c", "cd apps/api && bunx prisma migrate deploy && bunx prisma db seed && cd /app && bun run start:api"]

# Stage: Worker
FROM base AS worker
# No exposed port, just background jobs
CMD ["bun", "run", "start:worker"]

# Stage: Client (Builder & Server)
FROM base AS client
ARG VITE_API_URL
ARG VITE_CLIENT_URL
ARG VITE_SENTRY_DSN
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_CLIENT_URL=${VITE_CLIENT_URL}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
RUN cd apps/client && bun run build
EXPOSE 5173
# Typically you'd serve this with Nginx or a lightweight static server, but for now we'll run the preview
CMD ["bun", "run", "start"]
