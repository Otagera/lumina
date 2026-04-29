# Lumina - Worker

This service handles background processing tasks for Lumina to ensure the main API remains fast and responsive.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Queues**: Redis (typically using a library like BullMQ)
- **Language**: JavaScript / TypeScript

## Responsibilities

- **Image Optimization**: Automatically processes uploaded original images to generate optimized, web-friendly formats (e.g., WebP with a max width of 2000px).
- **AI Coordination**: Interfaces with the AI Service to orchestrate the face detection and embedding extraction process asynchronously.
- **Event Broadcasting**: Communicates back to the main API or directly updates the database so the API can push real-time status updates via SSE to the client.

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed and the database infrastructure (Postgres & Redis) running via Docker Compose.

### Development

To start the worker process:

```bash
bun run dev
```

Alternatively, from the root of the monorepo:

```bash
bun run dev:worker
```

The worker continuously listens to the Redis queue for new jobs dispatched by the API.
