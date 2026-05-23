# Lumina - Deployment Plan (Parked)

## Current Status: PAUSED

Last updated: May 22, 2026

---

## Deployment Options Explored

### Option 1: Self-Hosted Coolify (CX33 - €4.99/mo)
- **Selected** - But parked due to cost decision
- Server: Hetzner CX33 (4 vCPU, 8GB, 80GB) - €4.99/mo
- Would need: ~€5-10/mo additional for R2 storage
- **Total est**: ~€10-15/mo

**What was prepared:**
- docker-compose.yml updated with env vars
- Sentry SDK added to client and API
- .env.coolify with complete deployment instructions
- **New Guest App (PWA):** `apps/app` added to the stack.

### Option 2: GCP (~$50-70/mo)
- **Rejected** - Too expensive

### Option 3: Leave Local
- **Current decision**

---
Self hosted
- After creation ssh with - `ssh root@<ip address>`

---

## Quick Share Options (For Testing)

If you want to share the app locally with someone:

### Option A: ngrok
```bash
# Install
brew install ngrok

# Run tunnels (Dashboard + Guest App + API)
ngrok http 5173
ngrok http 5174
ngrok http 3005
```

### Option B: Cloudflare Tunnel
```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:5173
```

---

## When Ready to Deploy - Next Steps

### Option A: Coolify (Recommended)
1. Get CX33 server (€4.99/mo from Hetzner)
2. Install Coolify on server
3. Create Sentry project at sentry.io → get DSN
4. Generate a metrics token for the cache observability endpoint:
   `openssl rand -hex 32` (will become `METRICS_TOKEN` in `.env.coolify`)
5. In Coolify:
   - Add Docker Compose resource (db, redis, api, worker, ai_service)
   - Add Static resource for **Dashboard** (base: `apps/client`, build: `bun run build`, output: `dist`, FQDN: `lumina.otagera.xyz`)
   - Add Static resource for **Guest App** (base: `apps/app`, build: `bun run build`, output: `dist`, FQDN: `lumina-app.otagera.xyz`)
   - Set all env vars from `.env.coolify` (including `METRICS_TOKEN`; leave unset to disable the endpoint)
   - For the **AI service**, choose one semantic backend strategy:
     - `SEMANTIC_MODEL=clip-vit-b-32` + `SEMANTIC_BACKEND=torch` → legacy/default path
     - `SEMANTIC_MODEL=mobileclip-s2` + `SEMANTIC_BACKEND=torch` → MobileCLIP torch path
     - `SEMANTIC_MODEL=mobileclip-s2` + `SEMANTIC_BACKEND=onnx` → Docker exports ONNX during build
     - `SEMANTIC_MODEL=mobileclip-s2` + `SEMANTIC_BACKEND=onnx` + `SEMANTIC_ONNX_QUANTIZE=true` → Docker exports + quantizes INT8 during build
6. Configure R2 CORS in Cloudflare dashboard
7. Deploy
8. If deploying MobileCLIP search, apply the `images.embedding_model` migration and then run the semantic backfill as a one-shot deployment task:
   `bun apps/worker/src/scripts/backfillSemanticEmbeddings.ts --model mobileclip-s2 --enqueue`
   - Do **not** run backfill during Docker build or every container boot.
   - Run it only after the API migration is applied and the AI service is reachable with the target semantic model.
9. Smoke-test the metrics endpoint:
   `curl -H "x-metrics-token: $METRICS_TOKEN" https://lumina-api.otagera.xyz/api/metrics/cache`
   (Expect `status: "completed"` with namespaced hit/miss counters. Without the
   header → 401. Without `METRICS_TOKEN` set on the server → 503.)

### AI Service Deployment Notes

#### Local development vs deployment

- **Local dev** still uses the ordinary monorepo scripts (`bun run dev:ai`, `bun run dev:all`).
- ONNX/INT8 export is **not** auto-run for local dev; developers run the scripts manually when testing those paths.
- **Docker deployment builds** now auto-run the semantic preparation step for the AI image.

#### Docker AI build behavior

The AI Dockerfile now supports these build args:

- `SEMANTIC_MODEL`
- `SEMANTIC_BACKEND`
- `SEMANTIC_ONNX_QUANTIZE`

Behavior:

- `SEMANTIC_BACKEND=torch` → predownloads the selected torch model into the image cache.
- `SEMANTIC_BACKEND=onnx` → runs `apps/ai/scripts/export_mobileclip_onnx.py` during build and bakes ONNX artifacts into `/app/apps/ai/models/mobileclip-s2-runtime`.
- `SEMANTIC_BACKEND=onnx` + `SEMANTIC_ONNX_QUANTIZE=true` → additionally runs `apps/ai/scripts/quantize_mobileclip_onnx.py` and bakes INT8 artifacts into the same runtime directory.

The image sets:

- `SEMANTIC_ONNX_DIR=/app/apps/ai/models/mobileclip-s2-runtime`

So container startup does **not** need a separate export/quantize job.

#### Recommended deployment build targets

Use one of these AI image configurations:

```bash
# Legacy CLIP baseline
docker build \
  --build-arg SEMANTIC_MODEL=clip-vit-b-32 \
  --build-arg SEMANTIC_BACKEND=torch \
  -f apps/ai/Dockerfile .

# MobileCLIP torch
docker build \
  --build-arg SEMANTIC_MODEL=mobileclip-s2 \
  --build-arg SEMANTIC_BACKEND=torch \
  -f apps/ai/Dockerfile .

# MobileCLIP ONNX FP32
docker build \
  --build-arg SEMANTIC_MODEL=mobileclip-s2 \
  --build-arg SEMANTIC_BACKEND=onnx \
  -f apps/ai/Dockerfile .

# MobileCLIP ONNX INT8
docker build \
  --build-arg SEMANTIC_MODEL=mobileclip-s2 \
  --build-arg SEMANTIC_BACKEND=onnx \
  --build-arg SEMANTIC_ONNX_QUANTIZE=true \
  -f apps/ai/Dockerfile .
```

#### Semantic search rollout order

If switching from `clip-vit-b-32` to `mobileclip-s2`, follow this order:

1. Build and deploy the target AI image.
2. Apply the API migration adding `images.embedding_model`.
3. Verify the AI service `/health` reports the expected semantic model/backend.
4. Run the one-shot backfill enqueue script.
5. Let the worker repopulate embeddings for semantic-enabled albums.
6. Only then rely on MobileCLIP semantic search in production.

Reason: old and new 512D embeddings are **not** comparable across model families.

---

## Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Template for all env vars |
| `.env.coolify` | Coolify deployment guide + vars |
| `.env` | Local development (not committed) |

---

## Key Files for Deployment

| File | Notes |
|------|-------|
| `docker-compose.yml` | Includes DB, Redis, API, Worker, AI, and Guest App |
| `.env.coolify` | Complete deployment instructions |
| `apps/client/vite.config.ts` | Dashboard config |
| `apps/app/vite.config.ts` | Guest App config |
| `Dockerfile` | Multi-stage: api, worker, client, app |
| `apps/ai/Dockerfile` | AI image with semantic torch / ONNX / INT8 build-time preparation |
| `apps/ai/README.md` | Local vs deployment instructions for semantic backends |

---

## Tech Stack Summary

| Component | Technology |
|-----------|------------|
| API | Bun + Elysia |
| Dashboard | React + Vite |
| Guest App | React + Wouter (Ultra-lightweight PWA) |
| Worker | Bun + BullMQ |
| AI Service | Python + FastAPI |
| Database | PostgreSQL + pgvector |
| Queue | Redis |
| Storage | Cloudflare R2 (configured) |
| Real-time | SSE (Unified) |
| Logging | Pino JSON + Sentry (SDK added) |

---

## Parking Notes

- Deployment paused due to cost
- Local development continues normally
- All features working
- Can test with ngrok anytime for sharing
- Code is ready for deployment when ready
- **Semantic Search:** Now implemented with `pgvector` and supports `clip-vit-b-32`, `mobileclip-s2` torch, MobileCLIP ONNX, and optional ONNX INT8. Deployment still requires a controlled backfill when switching model families.