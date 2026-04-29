FROM oven/bun:1.2 AS base

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/client/package.json apps/client/
COPY apps/worker/package.json apps/worker/
COPY packages/auth/package.json packages/auth/
COPY packages/config/package.json packages/config/
COPY packages/models/package.json packages/models/
COPY packages/utils/package.json packages/utils/

# Install dependencies (ignoring scripts to avoid running prepare scripts for UI if not needed)
RUN bun install --ignore-scripts

# Copy the rest of the monorepo code
COPY . .

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Generate Prisma Client (Bypass SSL for binary download if needed)
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
# Build the client
RUN cd apps/client && bun run build
EXPOSE 5173
# Typically you'd serve this with Nginx or a lightweight static server, but for now we'll run the preview
CMD ["bun", "run", "start"]
