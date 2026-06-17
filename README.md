# Lumina

![diagram-export-15-04-2025-11_32_33](https://github.com/user-attachments/assets/f4715318-8575-4a6b-9227-4073fb53c234)

## Overview

Lumina is an **AI-powered photo platform for events**. Hosts create albums, guests contribute photos via QR code without an account, and anyone can find every photo of themselves by taking a selfie. Lumina separates AI compute from physical storage — use managed Cloudflare R2 or connect your own S3-compatible bucket.

## Features

**For hosts**
- **Collaborative Events** — Share one QR code. Guests upload photos directly; no account required.
- **Visual Theme Editor** — Full-screen Framer-style editor at `/album/:id/theme`. 6 curated presets, custom accent color, font, hero layout (two-col / centered / full banner), background texture, corner radius tokens, photo grid style (bento / uniform / masonry), hero image or slideshow, and host branding strip.
- **Moderation Queue** — Review and approve guest uploads before they go live.
- **Face Clustering** — Automatic DBSCAN clustering groups recognized faces into people.
- **People Management** — Tag and name recognized faces across the album.
- **BYOS (Bring Your Own Storage)** — Connect AWS S3 or Cloudflare R2. Lumina handles the AI; you own the files.
- **Usage & Billing** — Compute unit tracking with per-user quotas and billing webhook.
- **Album Lifecycle** — Three phases: *collecting* → *curating* → *delivered*, surfaced in the shared album UI.

**For guests**
- **Selfie to Find My Photos** — Take a selfie; face search returns every matching photo in seconds.
- **Semantic Search** — Natural language queries ("dancing", "beach", "cake cutting") powered by CLIP + pgvector.
- **Guest Upload** — Contribute photos with optional face-indexing opt-out.
- **Bulk Download** — ZIP generation for downloading all or selected photos.
- **Privacy Controls** — Guests can delete their selfie embedding immediately after their search.

**Platform**
- **Real-time Updates** — SSE feed keeps guest albums live as photos are approved.
- **Background Uploads** — Persistent upload manager (IndexedDB) survives page reloads.
- **Image Optimization** — WebP conversion worker generates display-tier images automatically.
- **Free-tier TTL** — Uploaded photos expire after 14 days on the free plan.
- **Observability** — Structured JSON logging → Vector → Better Stack; Sentry for error tracking.

## Project Structure

Lumina is a monorepo managed with [Bun Workspaces](https://bun.sh/docs/install/workspaces).

```
apps/
  api/       — Core backend (Elysia JS + Bun)
  client/    — Host dashboard + shared album guest experience (React + Vite + Tailwind)
  ai/        — Python/FastAPI service: face embeddings (InsightFace) + CLIP semantic search
  worker/    — Bun background processor: image optimization, queue draining
packages/
  models/    — Prisma-backed DB queries (@lumina/models)
  auth/      — JWT + session logic (@lumina/auth)
  config/    — DB + Redis client config (@lumina/config)
  utils/     — Shared utilities: validators, image utils, cache (@lumina/utils)
  event-sdk/ — Public album client types (@lumina/event-sdk)
```

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) v1.2+
- [Python](https://python.org) 3.11+
- [Docker](https://www.docker.com/) (for Postgres + Redis)

### Local setup

```bash
# 1. Clone
git clone https://github.com/your-repo/lumina.git
cd lumina

# 2. Start infrastructure
docker-compose up -d db redis

# 3. Install JS/TS dependencies
bun install

# 4. Install Python dependencies
cd apps/ai && pip install -r requirements.txt && cd ../..

# 5. Apply DB migrations
cd apps/api && bunx prisma migrate deploy && cd ../..

# 6. Run all services
bun run dev:all
```

### Run services individually

| Service | Command |
|---|---|
| API (Elysia) | `bun run dev:api` |
| Client (React) | `bun run dev` |
| Worker | `bun run dev:worker` |
| AI service | `bun run dev:ai` |

### Docker (full stack)

```bash
docker-compose up --build
```

## API Reference

**Auth**
- `POST /api/v1/auth/signup` — Register
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh token
- `POST /api/v1/auth/logout` — Logout

**Albums**
- `GET /api/v1/albums` — List albums
- `POST /api/v1/albums` — Create album
- `GET /api/v1/albums/:id` — Album detail
- `PUT /api/v1/albums/:id` — Update album (name, settings, theme, share token)
- `DELETE /api/v1/albums/:id` — Delete album

**Images**
- `POST /api/v1/images` — Upload images
- `GET /api/v1/images/:id` — Image detail + faces
- `DELETE /api/v1/images/:id` — Delete image
- `POST /api/v1/images/bulk-download` — Initiate ZIP download job
- `GET /api/v1/images/bulk-download/:jobId` — Poll ZIP status

**Faces & People**
- `GET /api/v1/faces/:id` — Face detail
- `POST /api/v1/faces/search` — Face similarity search
- `PATCH /api/v1/faces/:id` — Assign person to face
- `GET /api/v1/people` — List people
- `POST /api/v1/people` — Create person
- `PUT /api/v1/people/:id` — Rename person
- `DELETE /api/v1/people/:id` — Delete person

**Search**
- `POST /api/v1/search/semantic` — Natural language image search (CLIP)

**Public / Shared Albums**
- `GET /api/v1/public/albums/:token` — View shared album (includes `theme_config`)
- `POST /api/v1/public/albums/:token/upload` — Guest photo upload
- `POST /api/v1/public/albums/:token/search-by-image` — Selfie → face match
- `DELETE /api/v1/public/albums/:token/selfie-data` — Delete guest selfie embedding
- `POST /api/v1/public/faces/search` — Face search in shared album

**Settings & Storage**
- `GET /api/v1/settings` — User preferences + storage configs
- `POST /api/v1/settings/storage` — Add BYOS config
- `PUT /api/v1/settings/storage/:id` — Update BYOS config
- `DELETE /api/v1/settings/storage/:id` — Remove BYOS config

**Usage**
- `GET /api/v1/usage` — Usage stats
- `POST /api/v1/webhooks/billing` — Billing metering webhook

## Demo

Visit `/share/demo` for a live themed example (wedding preset) that runs off an in-memory synthetic album — no DB record required.

## Contributing

1. Fork the repo.
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: your message"`
4. Push and open a PR.

## License

[MIT](LICENSE)
