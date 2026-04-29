# Lumina - API

This is the core backend service for Lumina. It handles authentication, album management, image uploads, and coordinates with the AI service and worker queues for background processing.

## Tech Stack

- **Framework**: [ElysiaJS](https://elysiajs.com/) (running on Bun)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL (with `pgvector` for face embeddings)
- **Caching / Queues**: Redis
- **Language**: TypeScript

## Features

- **RESTful Endpoints**: Provides routes for Albums, Images, Faces, People, and Authentication.
- **SSE Support**: Includes endpoints for Server-Sent Events to push live processing statuses to the client.
- **Monorepo Integration**: Uses shared models and utilities from the `packages/` directory (`@lumina/models`, `@lumina/auth`, etc.).

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed and the database infrastructure (Postgres & Redis) running via Docker Compose.

### Development

To start the API development server:

```bash
bun run dev
```

Alternatively, from the root of the monorepo:

```bash
bun run dev:api
```

This will run the server on port `3000`.

### Database Migrations

This project uses Prisma. To apply migrations or generate the client, run the respective prisma commands from within `apps/api` or use the monorepo scripts.

```bash
bunx prisma generate
bunx prisma migrate dev
```
