# Consolidated Feature Roadmap 2026

## Overview

This document consolidates feedback from three strategic reviews into a cohesive implementation plan for the photo management application. The roadmap prioritizes security and reliability first, followed by core product features, then collaboration and growth capabilities, and finally operational efficiency and long-term differentiation.

The application currently supports collaborative photo events, face recognition, BYOS (Bring Your Own Storage) via Cloudflare R2, and guest uploads. These features form the foundation upon which the roadmap builds.

---

## Phase 1: Security, Trust, and Upload Reliability (Days 1-30)

These features address immediate security gaps, prevent data loss, and improve upload reliability. They form the foundation before scaling to heavier traffic.

### 1.1 Secure Session Management

**What to build:** Replace client `localStorage` access-token storage with secure HTTP-only cookie-based authentication. Add refresh-token rotation and server-side token invalidation support.

**Current State:** Tokens are stored in localStorage, vulnerable to XSS attacks.

**Implementation:**

- Modify authentication middleware to issue `HttpOnly`, `Secure`, `SameSite=Strict` cookies
- Implement refresh token rotation (invalidate old refresh token on each use)
- Add server-side token invalidation endpoint for "logout everywhere" functionality
- Update client to read auth state from cookies instead of localStorage
- Add cross-origin cookie support for development (separate localhost:3000 and localhost:4000)

**Files Affected:** `apps/api/src/middleware/auth.middleware.ts`, `apps/api/src/routes/auth.route.ts`, `apps/client/src/lib/auth.ts`

**Pros:** Major reduction in token theft risk from XSS. Better enterprise readiness and customer trust.

**Cons:** Requires auth flow refactor across API and client. More complex local-dev and cross-origin cookie setup.

---

### 1.2 Password Reset Flow

**What to build:** The forgot-password page exists but is mocked with a `setTimeout`. Implement full password reset with email delivery.

**Current State:** Page exists but does nothing.

**Implementation:**

- Integrate email provider (Resend, SendGrid, or Postmark)
- Create `password_resets` table with token, user_id, expires_at
- Add `POST /api/v1/auth/forgot-password` endpoint (rate limited)
- Add `POST /api/v1/auth/reset-password` endpoint with token validation
- Create email templates for reset link
- Set token expiry (15 minutes)
- Add rate limiting to prevent abuse

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/routes/auth.route.ts`, email templates

**Pros:** Basic expectation for any auth system. Without it, users who forget their password are permanently locked out.

**Cons:** Requires email provider integration which adds a dependency and operational cost.

---

### 1.3 Rate Limiting on Public Routes

**What to build:** The `express-rate-limit` package is installed but only wired up in the old Express middleware file. The Elysia routes for public guest upload and selfie search endpoints have no rate limiting.

**Current State:** Public routes are unprotected from abuse.

**Implementation:**

- Implement Redis-backed rate limiter for Elysia
- Configure limits per endpoint:
  - Public album access: 100 requests/minute
  - Guest upload: 10 requests/minute per IP
  - Selfie search: 20 requests/minute per IP
  - Presigned URL generation: 5 requests/minute
- Add X-RateLimit-* headers to responses
- Create separate limiters for authenticated vs anonymous traffic

**Files Affected:** `apps/api/src/plugins/rate-limit.plugin.ts`, `apps/api/src/routes/public.route.ts`

**Pros:** Prevents abuse of the most expensive endpoints (AI processing, presigned URL generation).

**Cons:** Redis-backed rate limiting adds latency per request. Needs tuning to avoid blocking legitimate burst uploads at events.

---

### 1.4 File Safety Pipeline

**What to build:** Generate server-side keys (UUID-based). Validate MIME type, extension, and actual content signature. Add upload policy checks before processing queue admission.

**Current State:** Files are uploaded with client-provided filenames and limited validation.

**Implementation:**

- Generate UUID-based object keys before upload
- Validate file extension against allowlist (jpg, jpeg, png, heic, webp, mp4, mov)
- Detect MIME type from file magic bytes (not just extension)
- Reject files with MIME mismatch (e.g., .exe renamed to .jpg)
- Add upload policy checks before queue admission
- Sanitize client-provided filenames for display purposes only

**Files Affected:** `apps/api/src/routes/upload.route.ts`, `packages/utils/src/file-validator.ts`

**Pros:** Closes key security and operational abuse vectors. Improves processing reliability and lowers malformed-input failures.

**Cons:** Extra validation adds implementation and test overhead. May reject some edge-case files users currently upload.

---

### 1.5 True Upload Controls

**What to build:** Implement abortable transfers with `AbortController`. Wire UI to actual transfer state and implement resumable uploads where possible.

**Current State:** Uploads cannot be paused, resumed, or cancelled. No progress accuracy.

**Implementation:**

- Add `AbortController` support in upload client
- Implement tus protocol or similar for resumable uploads
- Show real upload progress (not estimated)
- Allow pause/resume for large files (>50MB)
- Handle network interruptions gracefully with auto-retry
- Persist upload state to localStorage for recovery on page refresh

**Files Affected:** `apps/client/src/lib/upload-manager.ts`, `apps/api/src/routes/upload.route.ts`

**Pros:** Immediate UX quality improvement for heavy/mobile users. Reduces frustration and failed attempts on unstable networks.

**Cons:** Resumable strategy can be non-trivial depending on storage provider. Requires synchronized client/API semantics for retries and partial state.

---

## Phase 2: Core Features and Product Value (Days 31-60)

These features significantly enhance the core utility of the app, turning it from a basic gallery into a true photo management system.

### 2.1 Face Tagging Policy Enforcement

**What to build:** The `tagging_policy` field exists in the schema (`HOST_ONLY`, `GUESTS_SELF`, `ANYONE`) but is never checked in any route. It's stored and displayed but has no effect.

**Current State:** Policy is stored but not enforced.

**Implementation:**

- Add policy check in face tagging endpoint (`POST /api/v1/faces/:faceId/tag`)
- Pass identity context through public routes (guest session)
- Create middleware to enforce policy based on user type:
  - `HOST_ONLY`: Only album owner can tag
  - `GUESTS_SELF`: Guests can tag themselves only
  - `ANYONE`: Any authenticated user can tag anyone
- Update frontend to disable/enable tagging UI based on policy

**Files Affected:** `apps/api/src/routes/faces.route.ts`, `apps/api/prisma/schema.prisma`, `apps/client/src/components/FaceTagging.tsx`

**Pros:** Closes gap between UI promises and backend enforcement. High trust impact for event hosts.

**Cons:** Requires passing identity context through public routes, which currently have no concept of "who this guest is."

---

### 2.2 Persistent Guest Sessions

**What to build:** Guests who upload to a moderation-enabled album lose visibility of their pending photos on refresh. Implement persistent tracking via cookies.

**Current State:** Pending photos only visible locally via UploadContext. Lost on refresh.

**Implementation:** (Detailed plan exists in `apps/docs/persistent_guest_sessions.md`)

- Add `guest_session_id` column to `images` table
- Create guest session middleware in public routes
- Generate UUID and set as long-lived HTTP-only cookie on first visit
- Attach `guest_session_id` to images on upload
- Update public album fetch to return pending images matching session ID
- Add `isPending` flag to response for pending images
- Remove local hack in frontend, rely on server state

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/routes/public.route.ts`, `apps/client/app/routes/sharedAlbum.tsx`

**Pros:** Major UX improvement for core collaborative event use case. Guests feel abandoned when their upload disappears.

**Cons:** Requires guest_session_id cookie, DB column, and updated query logic — moderate scope.

---

### 2.3 Soft Delete with 30-Day Retention

**What to build:** Instead of immediately executing a DELETE query, flag items as `deletedAt` and move to a temporary "Trash" view. Allow restore within 30 days.

**Current State:** All deletes are hard and immediate.

**Implementation:** (Detailed plan exists in `apps/docs/soft-delete-plan.md`)

- Add `deleted_at` columns to `albums` and `images` tables
- Update all fetch functions to filter `deleted_at: null` by default
- Convert delete functions from hard to soft delete
- Add restore endpoints (`POST /api/v1/albums/:albumId/restore`, `POST /api/v1/images/:imageId/restore`)
- Create purge worker to hard delete records older than 30 days
- Schedule daily at 3am
- Handle usage tracking (reduce on soft delete, restore on restore)

**Files Affected:** See detailed plan in `apps/docs/soft-delete-plan.md`

**Pros:** Prevents catastrophic accidental data loss. Builds significant user trust.

**Cons:** Complicates storage quota calculations and requires background worker for hard deletes.

---

### 2.4 Email Notifications

**What to build:** No email is sent at any point — not on signup, not when a guest's photo is approved, not when clustering completes.

**Current State:** Silent system, no user feedback on async operations.

**Implementation:**

- Integrate email provider (Resend recommended for developer experience)
- Create email templates:
  - Welcome email on signup
  - Guest photo approved notification
  - Clustering complete notification
  - Album shared with you
  - New photos in shared album
- Add event triggers:
  - On user registration (welcome)
  - On image status change to APPROVED (notify uploader)
  - On face clustering job completion (notify album owner)
- Implement unsubscribe functionality
- Add email log to database for debugging

**Files Affected:** `apps/api/src/services/email.service.ts`, `apps/worker/src/queue/workers/*.worker.js`

**Pros:** Closing feedback loop for async operations dramatically improves perceived reliability.

**Cons:** Email deliverability is a separate discipline. Transactional email needs careful domain setup to avoid spam folders.

---

### 2.5 Search and Filter Within Albums

**What to build:** No search capability exists. Albums with 500+ guest uploads become unnavigable.

**Current State:** Flat list, no filtering.

**Implementation:**

- Add filter options in album view:
  - Date range picker
  - Face count filter (0, 1, 2+)
  - Status filter (APPROVED, PENDING, REJECTED)
  - Uploader (for shared albums)
- Implement date range filtering via `taken_at` EXIF field
- Add face count query on album_images join
- Store filter preferences in localStorage
- Consider pagination for large albums

**Files Affected:** `apps/api/src/routes/albums.route.ts`, `apps/client/src/components/AlbumFilters.tsx`

**Pros:** Addresses real scalability problem for large events.

**Cons:** Full-text search on image metadata is limited. Useful filters are date range, face count, and status — all queryable without extra infrastructure.

---

### 2.6 Download Individual Photos

**What to build:** Guests can download from shared album view, but authenticated users have no single-image download button in their own gallery.

**Current State:** Only bulk download via job queue.

**Implementation:**

- Add download button to image detail view
- Use presigned URL flow (already implemented for R2)
- Track download events for analytics
- Add to activity log

**Files Affected:** `apps/api/src/routes/pictures.route.ts`, `apps/client/src/components/ImageViewer.tsx`

**Pros:** Obvious missing capability. Users expect it.

**Cons:** For cloud-stored images, requires signed URL flow (already implemented, just needs wiring).

---

### 2.7 Album Cover Photo Selection

**What to build:** Currently the cover is auto-generated from first 4 images in upload order. Hosts have no control.

**Current State:** Auto-generated only.

**Implementation:**

- Add `cover_image_id` column to `albums` table
- Create "Set as Cover" option on image context menu
- Add cover picker UI in album settings
- Default to existing auto-generated behavior for existing albums

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/routes/albums.route.ts`, `apps/client/src/components/AlbumCoverPicker.tsx`

**Pros:** Simple feature with high perceived quality impact. Events have hero photos that hosts care about.

**Cons:** Requires new DB column and UI for selection — low complexity but adds surface area.

---

## Phase 3: Collaboration, Growth, and Operational Efficiency (Days 61-90)

These features enhance collaboration, improve operational workflows, and prepare for monetization.

### 3.1 Granular Shared Album Permissions

**What to build:** Create permission model (Viewer, Contributor, Admin) for albums. Generate secure share links with specific permissions.

**Current State:** Binary public/private. Public albums allow upload by default.

**Implementation:**

- Add `album_members` table with role enum (VIEWER, CONTRIBUTOR, ADMIN)
- Create share link generation with permission scope
- Add optional passcode/PIN for sensitive albums
- Add one-time invite links (expire after use)
- Implement permission middleware on all album routes
- Add rate limiting per member on upload

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/routes/albums.route.ts`, `apps/api/src/middleware/permissions.middleware.ts`

**Pros:** High viral coefficient and retention. Makes app inherently collaborative.

**Cons:** Requires rigorous security audits on authorization middleware to ensure users cannot manipulate IDs to view unauthorized albums.

---

### 3.2 Notifications and Async Job Inbox

**What to build:** User-visible activity center for processing completion, errors, and approvals. Real-time and in-app history.

**Current State:** No notification system.

**Implementation:**

- Create `notifications` table with type, read status, metadata
- Add notification triggers on key events
- Build notification dropdown in header
- Implement real-time updates via WebSocket or polling
- Add "mark all as read" functionality
- Set retention policy (keep last 30 days)

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/services/notification.service.ts`, `apps/client/src/components/NotificationCenter.tsx`

**Pros:** Improves reliability perception in async-heavy workflows. Reduces need for manual page refreshes.

**Cons:** Requires event model, retention decisions, and notification UX.

---

### 3.3 Admin Moderation Workbench

**What to build:** Fast approve/reject triage queue with bulk actions and keyboard shortcuts for hosts.

**Current State:** Individual image approval only.

**Implementation:**

- Create moderation queue view in album settings
- Show pending images in grid with quick actions
- Add keyboard shortcuts (A=approve, R=reject, →=next)
- Bulk select and batch approve/reject
- Filter by date uploaded, uploader
- Show upload metadata (device, date, count)
- Add "reject with reason" for feedback

**Files Affected:** `apps/client/src/components/ModerationWorkbench.tsx`, `apps/api/src/routes/albums.route.ts`

**Pros:** High operational leverage for event hosts. Faster turnaround from upload to published gallery.

**Cons:** Needs careful filtering and state-management to remain performant with large queues.

---

### 3.4 Duplicate Detection

**What to build:** If a guest uploads the same photo twice, it gets processed twice, consuming compute units.

**Current State:** No deduplication.

**Implementation:**

- Add file hash (SHA-256) column to images table
- Calculate hash on upload before processing
- Query existing images with matching hash before queuing AI
- Add perceptual hashing (pHash) for near-duplicates
- Create UI to review suggested duplicates
- Option to keep original and delete copy

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/services/dedupe.service.ts`, `apps/client/src/components/DuplicateReview.tsx`

**Pros:** Saves compute and storage costs. Improves gallery quality.

**Cons:** Perceptual hashing adds processing step and new index. False positives can lead to users deleting photos they wanted to keep.

---

### 3.5 People Merging

**What to build:** After clustering, same physical person often ends up in two separate `Person` records (e.g., one from manual tagging, one from auto-clustering).

**Current State:** No merge capability.

**Implementation:**

- Create merge UI showing side-by-side comparison
- Select target person to merge into
- Reassign all faces from source to target
- Handle name conflicts (prefer non-empty, most used)
- Clean up ignored_faces entries
- Update search index after merge

**Files Affected:** `apps/client/src/components/PeopleMerger.tsx`, `packages/models/src/people.model.ts`

**Pros:** Addresses direct consequence of current clustering approach.

**Cons:** Merge UI is non-trivial — need to handle face reassignment, ignored_faces cleanup, and name conflict resolution.

---

### 3.6 Usage and Billing-Ready Metering Dashboard

**What to build:** Real-time storage and compute consumption views by user and album. Alerts when nearing limits.

**Current State:** Usage tracking exists but not exposed to users.

**Implementation:**

- Create usage dashboard page
- Show storage breakdown by album
- Show compute unit usage (face detection, clustering)
- Add threshold alerts (80%, 90%)
- Generate downloadable usage reports (CSV)
- Support tier-based limits (free vs paid plans)
- Add billing webhooks for meter readings

**Files Affected:** `apps/api/src/routes/usage.route.ts`, `apps/client/src/pages/UsageDashboard.tsx`

**Pros:** Supports self-serve plans and pricing conversations. Increases transparency and reduces billing disputes.

**Cons:** Requires accurate event normalization and reconciliation rules.

---

### 3.7 Webhook on Album Events

**What to build:** Allow hosts to receive POST to a URL they configure when: guest uploads, photo approved, clustering completes.

**Current State:** No webhook system.

**Implementation:**

- Add webhook_url column to album_settings
- Create webhook_events table for delivery log
- Implement webhook dispatcher with retry logic (3 attempts, exponential backoff)
- Add HMAC signature for verification
- Create UI for webhook configuration
- Show delivery status and recent events

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/api/src/services/webhook.service.ts`, `apps/client/src/components/WebhookSettings.tsx`

**Pros:** Opens up integration possibilities — hosts could auto-post to Slack, trigger slideshow refresh, etc.

**Cons:** Webhook delivery is infrastructure — retries, failure logging, signature verification. Meaningful scope increase.

---

### 3.8 Server-Side Archive Generation (ZIP Streaming)

**What to build:** Instead of buffering blobs in browser (causes OOM crashes), send array of IDs to backend. Worker streams files into ZIP, uploads to temporary storage, returns presigned URL.

**Current State:** Client-side ZIP generation crashes on large batches.

**Implementation:**

- Create archive queue job
- Use Node.js stream ZIP library (archiver or yazl)
- Stream directly to R2 (multipart upload)
- Generate presigned URL with 24-hour expiry
- Add cleanup cron job to delete ZIPs after 24 hours
- Track archive generation in job queue
- Show progress in UI

**Files Affected:** `apps/worker/src/queue/workers/archive.worker.ts`, `apps/api/src/routes/download.route.ts`

**Pros:** Eliminates client-side memory crashes. Supports massive batch downloads. Handles connections gracefully.

**Cons:** Requires managing temporary storage lifecycle and ties up backend network I/O.

---

## Phase 4: Longshots and R&D (Days 90+)

These are technically complex, high-impact projects that differentiate the application but require significant architectural investment. They should be validated via prototypes and customer interviews before full commitment.

### 4.1 Rewriting Heavy Workers in Rust

**What to build:** Move computationally heavy tasks — face recognition queue, image optimization, face clustering — into Rust.

**Current State:** JavaScript/Node.js for all workers.

**Implementation:**

- Create Rust worker binaries usingActix-web or similar
- Port image processing to image crate
- Port face detection to Rust face detection bindings
- Use rayon for parallel processing
- Implement gRPC communication with main API
- Add Docker Compose for local development
- Set up CI/CD for Rust builds

**Files Affected:** New `apps/worker-rust/` directory, CI pipeline updates

**Pros:** Drastically reduces memory footprint and CPU time. Node.js is often memory-heavy for image processing; compiled language handles parallel pixel buffer processing efficiently.

**Cons:** Introduces polyglot architecture, complicates local development and CI/CD pipelines.

---

### 4.2 Semantic Natural Language Search

**What to build:** Integrate lightweight vision model (like CLIP) in background workers to generate embeddings for every uploaded image. Store in vector database for natural language search.

**Current State:** No semantic search capability.

**Implementation:**

- Integrate CLIP model in worker pipeline
- Generate embedding on image upload (after optimization)
- Set up pgvector or Qdrant for embedding storage
- Create text embedding for search queries
- Implement cosine similarity search
- Add reranking for relevance
- Consider pagination and filtering

**Files Affected:** `apps/worker/src/queue/workers/embedding.worker.ts`, new vector DB setup

**Pros:** "Wow" feature matching Google Photos or Apple Photos UX.

**Cons:** High compute cost to generate embeddings. Requires vector store infrastructure, increasing costs.

---

### 4.3 Offline-First Progressive Web App

**What to build:** Utilize Service Workers and IndexedDB to cache UI, recent albums, low-res thumbnails. Allow offline metadata changes and upload queue, sync on reconnect.

**Current State:** Standard SPA, requires network for all operations.

**Implementation:**

- Create Service Worker for asset caching
- Implement IndexedDB for offline storage
- Add upload queue with retry logic
- Implement conflict resolution (server wins vs client wins)
- Add offline indicator UI
- Test with Lighthouse PWA audit
- Handle complex scenarios (album deleted while offline)

**Files Affected:** `apps/client/public/sw.js`, `apps/client/src/lib/offline-sync.ts`

**Pros:** Incredible native-feeling UX regardless of network conditions.

**Cons:** Exceptionally difficult to implement correctly. State resolution and conflict management between client cache and server source-of-truth is massive undertaking.

---

### 4.4 Cross-Event Identity Graph

**What to build:** "Find me across all events" feature with consent model. Link person clusters across multiple albums.

**Current State:** People are isolated per album.

**Implementation:**

- Add consent model to user profile
- Create global person records (separate from album-scoped)
- Implement cross-album face matching
- Add opt-in workflow for users
- Create "Find my photos" search across events
- Handle privacy controls per album

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/client/src/pages/Profile.tsx`

**Pros:** Massive convenience and retention driver. Creates differentiated multi-event experience.

**Cons:** Significant privacy, consent, and policy complexity. Higher legal and compliance requirements.

---

### 4.5 Auto-Curate "Best Of" Album

**What to build:** AI ranking by quality, variety, and uniqueness. Generate "Best Of" album automatically.

**Current State:** No auto-curation.

**Implementation:**

- Implement quality scoring (sharpness, exposure, composition)
- Add diversity algorithm (avoid similar shots)
- Factor in engagement metrics if available
- Create "Best Of" album automatically
- Allow user to regenerate with different parameters
- Add explanation for why each photo was selected

**Files Affected:** `apps/worker/src/queue/workers/curation.worker.ts`

**Pros:** Strong wow-factor and shareability. Clear premium feature candidate.

**Cons:** Requires model quality tuning and clear explainability. Risk of subjective ranking dissatisfaction.

---

### 4.6 Face Recognition Without Uploading

**What to build:** Instead of uploading selfie, guests point camera and app identifies matching photos in real time using device camera stream and WebRTC API.

**Current State:** Upload required for face search.

**Implementation:**

- Add WebRTC camera access in browser
- Implement frame capture and throttling
- Send frames to AI service with debouncing
- Display real-time match results
- Handle mobile browser limitations
- Add permission flow for camera

**Files Affected:** `apps/client/src/components/LiveFaceSearch.tsx`, `apps/api/src/routes/faces.route.ts`

**Pros:** Faster and more convenient for guests. No file management needed.

**Cons:** Requires significant AI service changes, WebSocket infrastructure, will feel slow over mobile networks at events.

---

### 4.7 Multi-Host Albums

**What to build:** Allow album owner to invite co-hosts with moderation and clustering rights without full account ownership.

**Current State:** Single owner only.

**Implementation:**

- Create `album_members` table with roles (see 3.1)
- Add co-host invitation flow
- Implement role-based middleware
- Handle ownership transfer
- Add member management UI

**Files Affected:** `apps/api/prisma/schema.prisma`, `apps/client/src/components/AlbumMembers.tsx`

**Pros:** Enables collaborative event management without sharing account credentials.

**Cons:** Requires new table and permission middleware. Need to handle departing co-hosts.

---

### 4.8 On-Device Face Matching (WebAssembly)

**What to build:** Run lightweight face embedding model in browser using ONNX Runtime Web, match against pre-fetched embedding index, find photos without server round-trip.

**Current State:** All face matching via server API.

**Implementation:**

- Integrate ONNX Runtime Web
- Convert face embedding model to WebAssembly
- Create embedding index fetch on album load
- Implement client-side matching
- Handle model loading and caching
- Test across browsers

**Files Affected:** `apps/client/src/lib/face-matcher.ts`

**Pros:** Privacy-preserving and fast for guest. No server round-trip needed.

**Cons:** Embedding model size (~10MB), browser compatibility, matching accuracy at scale are real barriers.

---

### 4.9 Photographer Mode SDK / Partner API

**What to build:** B2B partner API for external camera workflows and ingestion.

**Current State:** No external API.

**Implementation:**

- Design RESTful API surface
- Implement OAuth 2.0 for partner authentication
- Add rate limiting and quotas
- Create API key management UI
- Document API with OpenAPI spec
- Add webhooks for async responses

**Files Affected:** `apps/api/src/routes/api/v2/`, new API documentation

**Pros:** Unlocks B2B channel partnerships and ecosystem growth. Enables ingestion from external cameras and workflows.

**Cons:** Higher support burden and API stability requirements. Requires robust auth scopes, quotas, and versioning.

## Phase 5: Python
**Quantization:** You can "quantize" your AI models (e.g., converting 32-bit floats to 8-bit integers). This can reduce memory usage and increase speed by 2x-4x with minimal loss in accuracy,
      allowing you to run the AI on much cheaper, lower-RAM servers.
**Batching:** If you are processing many faces, modify the Python code to process them in batches rather than one by one. The underlying C++ libraries are highly optimized for batch processing.

---

## Implementation Dependencies

Some features depend on others being completed first:

| Feature | Depends On |
|---------|------------|
| Face Tagging Policy Enforcement | Persistent Guest Sessions |
| Duplicate Detection (pHash) | File Safety Pipeline |
| Auto-Curate Best Of | Face Recognition, Duplicate Detection |
| Cross-Event Identity Graph | People Merging, Consent Model |
| Offline-First PWA | True Upload Controls |
| Server-Side Archive | File Safety Pipeline |

---

## Priority Summary

### Priority 1: Security, Trust, and Upload Reliability
1. Secure Session Management
2. Password Reset Flow
3. Rate Limiting on Public Routes
4. File Safety Pipeline
5. True Upload Controls

### Priority 2: Core Product Features
6. Face Tagging Policy Enforcement
7. Persistent Guest Sessions
8. Soft Delete with 30-Day Retention
9. Email Notifications
10. Search and Filter Within Albums
11. Download Individual Photos
12. Album Cover Photo Selection

### Priority 3: Collaboration and Operational
13. Granular Shared Album Permissions
14. Notifications and Async Job Inbox
15. Admin Moderation Workbench
16. Duplicate Detection
17. People Merging
18. Usage and Billing Dashboard
19. Webhook on Album Events
20. Server-Side Archive Generation

### Priority 4: Longshots
21. Rust Workers
22. Semantic Natural Language Search
23. Offline-First PWA
24. Cross-Event Identity Graph
25. Auto-Curate Best Of
26. Face Recognition Without Uploading
27. Multi-Host Albums
28. On-Device Face Matching
29. Photographer Mode SDK

---

## Backward Compatibility Considerations

- All new database columns should be nullable
- API responses should maintain backward compatibility with existing client versions
- Consider feature flags for gradual rollout
- Plan migration path for existing data (e.g., existing pending images won't have guest_session_id)

## Testing Requirements

- Security: Auth flow refactor, rate limiting, file validation
- Integration: Guest sessions, soft delete, email notifications
- Performance: Large album filtering, archive generation, duplicate detection
- UX: Upload controls, notification center, moderation workbench

---

## Open Questions

1. **Storage quota during grace period:** Do deleted items count against user's storage limit during the 30-day soft delete period?
2. **Email provider choice:** Resend, SendGrid, or self-hosted (Postfix)?
3. **Vector database:** pgvector (PostgreSQL extension) or dedicated (Qdrant)?
4. **Rust workers approach:** Separate microservices or embedded via Neon/NAPI?
5. **PWA sync strategy:** Server wins or client wins for conflicts?