# Lumina - Deployment Plan (Parked)

## Current Status: PAUSED

Last updated: May 12, 2026

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
4. In Coolify:
   - Add Docker Compose resource (db, redis, api, worker, ai_service)
   - Add Static resource for **Dashboard** (base: `apps/client`, build: `bun run build`, output: `dist`, FQDN: `lumina.otagera.xyz`)
   - Add Static resource for **Guest App** (base: `apps/app`, build: `bun run build`, output: `dist`, FQDN: `lumina-app.otagera.xyz`)
   - Set all env vars from `.env.coolify`
5. Configure R2 CORS in Cloudflare dashboard
6. Deploy

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
- **Semantic Search (Planned):** Implementation requires `pgvector` and upgraded VPS RAM.