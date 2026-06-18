# Lumina — Product Requirements Document

## Overview

Lumina is an AI-powered photo platform for events. Hosts create albums and share a single QR code; guests upload photos without an account; anyone finds every photo of themselves by taking a selfie. The platform separates AI compute from physical storage, supporting both managed Cloudflare R2 and user-supplied S3 buckets (BYOS).

---

## Core Features

### Collaborative Events
Hosts enable "Event Mode" on an album. Guests upload via QR/link, with optional moderation queues and upload-window expiry. Three lifecycle phases — *collecting* → *curating* → *delivered* — are visible to guests on the shared page.

### Face Recognition & Search
InsightFace (buffalo_l) detects faces, generates 512-dimension embeddings stored in pgvector, and DBSCAN clusters them into people across the album. Hosts tag people by name; guests search with a selfie.

### Semantic Natural Language Search
CLIP (clip-ViT-B-32 via sentence-transformers) encodes photos at upload time. Text queries use a 4-template prompt ensemble ("a photo of {}", "a picture of {}", "an image of {}", "{}") to improve recall for short keywords. Results are filtered at cosine similarity ≥ 0.2 after over-fetching from Postgres to ensure the filter has enough candidates.

### Visual Theme Editor
A full-screen Framer-style editor at `/album/:id/theme`. Dimensions:

| Dimension | Options |
|---|---|
| Preset | wedding, dark-luxe, garden, minimal, editorial, party |
| Accent color | Any hex |
| Background | light / dark / gradient (with from/to colors) |
| Background texture | none / noise / dots / grid-lines |
| Font | Inter / Playfair Display / Raleway / DM Sans |
| Corner radius | rounded / sharp / pill |
| Hero layout | two-col / centered / full banner |
| Hero background | solid / image URL / slideshow (cross-fade) |
| Photo grid | bento / uniform / masonry |
| Host branding | handle + URL link |
| Show cover in hero | boolean |
| Section ordering | drag-to-reorder, show/hide optional sections |

All config is stored in `theme_config JSONB` on `album_settings`. CSS variables are injected at runtime — no class-name rebuilding required.

### Guest Download Flow
Guests can download their matched or selected photos from the shared album view without an account. The host controls availability via an **Allow Downloads** toggle (`album_settings.allow_downloads`); downloads are only active once the album reaches the *delivered* phase. Client-side JSZip bundles selected images into a zip using signed URLs, avoiding server-side memory pressure. A public endpoint `POST /public/albums/:token/download` accepts up to 100 image IDs and returns a signed URL per image.

### Album Analytics
Hosts see a real-time dashboard under the **Analytics** tab in the album manager. Tracked events are written to the lightweight `album_views` table (no FK to `users`, no cascade) at three points: page load (`page_view`), selfie search (`selfie_search`), and text search (`text_search`). The dashboard shows total views and unique visitors (distinct `session_hash`), selfie and text search counts, upload breakdown (host vs. guest), reaction totals by type, and a top-6 photo grid ranked by reactions. A period toggle switches between all-time and last-7-days.

### Live Display Mode
Venues can run Lumina on a screen as a real-time slideshow. The host generates a 4-digit PIN from album settings (`album_settings.display_pin`); guests enter the PIN on the shared album page to open `/share/:token/live`. The live display page subscribes to the SSE events stream and prepends newly approved photos in real time. Two modes: **Slideshow** (cross-fade every 4 s) and **Grid wall** (masonry, fills in as photos arrive), toggled with a button in the corner.

### Smart Highlights Reel
The host triggers a one-click highlights generation from the album view (available once ≥ 20 photos are approved). A background worker (`highlightsGeneration`) selects up to 10 photos: when reactions exist, it takes the top-reacted 70% and fills the remaining 30% with time-spread picks to diversify the story arc; when no reactions exist, it spreads evenly across the upload timeline. The selection is stored in `album_highlights` and the result is broadcast via `HIGHLIGHTS_READY` SSE. Guests on the shared album see a **Highlights** button that opens a full-screen carousel with keyboard/swipe navigation and a "Download Highlights" option.

### Delivered Gallery
Photographers can publish a curated subset of event photos as a polished official gallery. From album settings, the host creates a **Delivered Gallery** — a linked album with its own share token (`albums.source_album_id` FK). The **Gallery** tab in the album manager shows a dual-panel interface: event photos on the left (with checkboxes to select) and the gallery on the right. Photos promoted to the gallery can be drag-reordered; positions are saved to `album_images.position` and respected on the shared page. Selfie search on the delivered gallery covers both the delivered set and the original event album (cross-album face search).

### Storage & Pricing
- **Compute credits** — users pay for face detection, embedding generation, clustering.
- **Managed storage** — Cloudflare R2 (zero egress).
- **BYOS** — users connect their own S3/R2 bucket; Lumina acts as the AI layer only.
- **Free tier TTL** — images expire and are hard-deleted after 14 days.

### Guest Privacy
- Face-indexing opt-out on upload.
- Selfie embedding deleted on demand after search.

### Observability
- Structured JSON logging → Vector (Rust) → Better Stack.
- Sentry for full-stack error tracking (Bun + React).

---

## Architecture

### Monorepo (Bun Workspaces)

```
apps/
  api/     — Elysia JS backend (Bun)
  client/  — React/Vite host dashboard + shared album guest experience
  ai/      — Python/FastAPI: InsightFace embeddings + CLIP semantic search
  worker/  — Bun: image optimization (WebP), background queues
packages/
  models/  — Prisma DB queries
  auth/    — JWT / session logic
  config/  — DB + Redis client
  utils/   — Validators, image utils, cache
  event-sdk/ — Public album client types
```

### Tech Stack
| Layer | Technology |
|---|---|
| API | TypeScript, Elysia JS, Bun |
| Frontend | TypeScript, React, Vite, Tailwind CSS |
| AI service | Python 3.11, FastAPI, InsightFace, sentence-transformers |
| Database | PostgreSQL + pgvector (Prisma ORM) |
| Cache | Redis |
| Storage | Cloudflare R2 (managed) + S3-compatible BYOS |
| Real-time | Server-Sent Events (SSE) |
| Observability | Vector, Better Stack, Sentry |
| Deployment | Docker Compose / Coolify |

---

## Database Schema

**`images`**
| Column | Type | Description |
|---|---|---|
| image_id | UUID (PK) | |
| image_path | TEXT | Original file path or cloud URL |
| optimized_path | TEXT | WebP display-tier path |
| storage_provider | TEXT | `local`, `r2`, `s3`, `byos` |
| storage_key | TEXT | Key within the storage provider |
| status | TEXT | `PENDING` / `APPROVED` / `REJECTED` |
| upload_date | TIMESTAMPTZ | |
| original_width / original_height | INT | |
| uploaded_by | UUID (FK → users) | |
| guest_session_id | UUID | Guest session for PENDING filtering |
| embedding | vector(512) | CLIP semantic embedding |
| embedding_model | TEXT | e.g. `clip-vit-b-32` |
| expires_at | TIMESTAMPTZ | Free-tier 14-day TTL |
| size / optimized_size | INT | Bytes |

**`faces`**
| Column | Type | Description |
|---|---|---|
| face_id | SERIAL (PK) | |
| image_id | UUID (FK → images) | |
| person_id | UUID (FK → people) | |
| embedding | REAL[] | 512-dim InsightFace embedding |
| bounding_box | JSONB | |
| processed_time | TIMESTAMPTZ | |

**`people`**
| Column | Type | Description |
|---|---|---|
| person_id | UUID (PK) | |
| name | TEXT | |
| user_id | UUID (FK → users) | |
| created_at / updated_at | TIMESTAMPTZ | |

**`albums`**
| Column | Type | Description |
|---|---|---|
| album_id | UUID (PK) | |
| album_name | TEXT | |
| created_by | UUID (FK → users) | |
| storage_config_id | UUID (FK → user_storage_configs) | |
| cover_image_id | UUID (FK → images) | |
| share_token | TEXT (unique) | Public access token |
| qr_color / qr_logo_url | TEXT | QR customization |
| creation_date | TIMESTAMPTZ | |

**`album_settings`**
| Column | Type | Description |
|---|---|---|
| album_id | UUID (PK, FK → albums) | |
| is_event | BOOLEAN | Collaborative event mode |
| requires_approval | BOOLEAN | Guest upload moderation |
| tagging_policy | TEXT | `HOST_ONLY` / `GUESTS_SELF` / `ANYONE` |
| expires_at | TIMESTAMPTZ | Upload window close time |
| allow_guest_uploads | BOOLEAN | |
| semantic_search_enabled | BOOLEAN | Enables CLIP text search |
| curating | BOOLEAN | Phase flag |
| delivered | BOOLEAN | Phase flag |
| tagline | TEXT | Custom message on shared page |
| theme_config | JSONB | Full visual theme (ThemeConfig) |
| webhook_url | TEXT | |

**`user_storage_configs`**
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| provider | TEXT | `r2`, `s3` |
| bucket / endpoint / region | TEXT | |
| access_key_id / secret_access_key | TEXT | Encrypted |

**`usage_logs`**
| Column | Type | Description |
|---|---|---|
| id | SERIAL (PK) | |
| user_id | UUID (FK → users) | |
| resource | TEXT | `storage`, `compute` |
| operation | TEXT | `face_recognition`, `face_search`, etc. |
| quantity | INT | |
| timestamp | TIMESTAMPTZ | |

**`plans`** — free / pro / enterprise plan definitions with storage_mb, compute_units_per_month, price.

**`album_members`** — role-based album membership (VIEWER / CONTRIBUTOR / ADMIN) with invite tokens.

---

## Milestones

All milestones 1–15 are complete. See commit history for implementation detail.

**Milestone 1–10:** Core CRUD, auth, face detection, face search, album sharing. ✅

**Milestone 11:** Framework migration Express → Elysia JS + Bun. ✅

**Milestone 12:** Advanced features — selfie search, SSE real-time, background uploads, image optimization, face tagging, improved auth. ✅

**Milestone 13:** UI/UX overhaul — bento grid, theatre mode, shared view parity. ✅

**Milestone 14:** Collaborative events & BYOS — storage abstraction, R2, event lifecycle, moderation, usage tracking. ✅

**Milestone 15: Observability & Search** ✅
- Structured JSON logging + Vector + Better Stack.
- Full-stack Sentry integration.
- Semantic search with cosine similarity filtering (threshold 0.2, prompt ensemble).
- Mobile-first Tinder-style face confirmation UI.

**Milestone 16: Visual Theme Editor** ✅
- Full-screen theme editor at `/album/:id/theme`.
- 6 curated presets with live preview pane.
- 8 theming dimensions: accent, background (light/dark/gradient), texture, font, corner radius, hero layout, hero background (solid/image/slideshow), photo grid style.
- Host branding strip + album cover in hero.
- `theme_config JSONB` as sole theme store; `theme_preset` column removed.
- Home page updated: 4-card features section, "Custom themes" trust signal.
- `/share/demo` themed with wedding preset.

**Milestone 17: Semantic Search Quality** ✅
- Threshold lowered 0.5 → 0.2 (correct CLIP matches score 0.20–0.35).
- Over-fetch from DB (`limit × 5`, max 200) before threshold filtering.
- 4-template prompt ensemble on all CLIP adapters for better keyword recall.

---

## Deferred / Future Work

- **Sidebar navigation** — sleek left sidebar replacing top nav.
- **Live slideshow mode** — real-time SSE-fed display for venue screens.
- **Two-album wedding flow** — candid pool + official curated album with one-click photo porting.
- **Mobile PWA** — installable guest experience as a standalone app.
- **AI search improvements** — re-rank with cross-encoder, multi-modal query (image + text).
