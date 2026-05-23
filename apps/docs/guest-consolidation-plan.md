# Guest PWA → Client Consolidation Plan

> Status: Proposal · last updated 2026-05-22
> Owner: Frontend / Platform
> Scope: Collapse `apps/app` (Guest PWA at `/e/:token`) into `apps/client` (`/share/:token`) as a single responsive surface, while porting PWA features and ergonomics into the client.
> Northstar: **Wedding Photographer** — a host creates an album, guests scan a QR to contribute photos and Find-My-Face, then the host curates a final gallery to deliver to the client.

---

## 1. Why consolidate

### 1.1 Current pain

Two apps, one job:

- `apps/app` (PWA, wouter, `/e/:token`) — guest discovery: Find-My-Face, semantic search, reactions, install-to-homescreen, offline fallback. **Read-only**, no uploads.
- `apps/client` (SPA, react-router, `/share/:token`) — desktop management: full grid, bulk download, multi-file `UploadManager`, contribute modal. **No semantic search, no offline cache, no install prompt, no reactions**.

The two surfaces:

- Hit the same `getSharedAlbumService` backend (`/api/public/albums/:token`).
- Use the same `InAppCamera` (already unified in `packages/ui/src/components/domain/InAppCamera.tsx`).
- Use different routers (wouter vs react-router-dom), different module styles, and are deployed as separate static apps on separate FQDNs (Coolify: `lumina-app.otagera.xyz` vs the main client domain).
- Are visibly drifting: the client got the Glass Hero, stats strip, and the diverse imagery refresh; the PWA did not. The PWA has semantic search and reactions; the client does not.

### 1.2 Cost of the status quo

| Category | Impact |
|---|---|
| Code duplication | `usePublicEventClient` exists twice (client copy, PWA copy via `useEventLogic`). Two `InstallPrompt`s would be needed. Two QR scan flows. Two semantic search wirings. |
| QA surface | Every public-album change must be smoke-tested on both `/e/:token` and `/share/:token`. |
| Build pipeline | Two Vite configs, two Coolify resources, two FQDNs, two TLS certs. |
| Feature lag | New endpoints (e.g. Phase 4 stats) need wiring twice; in practice, one surface always lags. |
| Mental model | Contributors must learn two routers (wouter + react-router), two folder conventions (`apps/app/app/components/event/*` vs `apps/client/app/components/*`). |

### 1.3 Why this is safe to do now

- User explicitly waived QR backwards compatibility for `/e/:token` → `/share/:token` migration.
- `InAppCamera` is already in `packages/ui` — the hardest unification is done.
- `@lumina/event-sdk` already abstracts the public-album client; both apps consume it identically.
- The client's `MainContainer` and design tokens (`rounded-tile`, `bg-white/80`, z-index scale) are the canonical surface; we move PWA features **into** that surface, not the other way around.

---

## 2. Target architecture

### 2.1 Single responsive route

`apps/client/app/routes/sharedAlbum.tsx` becomes the **only** guest entry point. Breakpoint contract:

| Viewport | Layout | Surface emphasis |
|---|---|---|
| `< sm` (≤ 639px) | Single column · sticky CTA bar at bottom · Glass hero collapses to one row (album name + phase pill + Find-My-Face) · QR icon moves into hero corner · grid is 2-col bento | Discovery + Quick Contribute |
| `sm` to `md` (640–1023px) | Two-column hero · 3-col grid · Contribute and Find-My-Face share a CTA row | Discovery + Contribute |
| `≥ md` (≥ 1024px) | Full Glass Hero (current desktop) · stats strip visible · 4-col bento grid · `BulkActionBar` enabled · `UploadManager` modal | Management + Contribute + Discovery |

Mobile guests should never see `BulkActionBar` or the multi-file `UploadManager` modal — those are pure desktop affordances. Conversely, desktop hosts should still see all mobile features (Quick Contribute file picker is just hidden behind the existing Contribute button).

### 2.2 Lifecycle phases (server-derived)

`getSharedAlbumService` returns a new `phase` enum computed from album state:

| Phase | When | UI delta |
|---|---|---|
| `collecting` | `canUpload && now < event_date + 24h` | Sage phase pill · Contribute prominent · live SSE reactions on · "Add this moment" mobile CTA visible |
| `curating` | `!canUpload && images.some(pending)` OR host has marked `curating=true` | Amber pill · Contribute hidden · grid shows only approved photos · banner: "Your photographer is curating" |
| `delivered` | host has marked `delivered=true` OR `now > event_date + N days` and album is finalised | Zinc pill with date · Find-My-Face + Download All promoted · semantic search top-of-page · no Contribute |

Phase is computed server-side in `apps/api/src/services/public/getSharedAlbum.service.ts` and shipped on the album response. UI gating is one switch in the route.

---

## 3. Migration order (9 steps)

Steps are designed to be independently shippable and reversible. Each step lists files touched, tests to add/update, and acceptance criteria.

### Step 1 — Stats endpoint + `phase` field (backend)

**Goal:** Single public read returns everything the unified UI needs.

**Files:**

- `apps/api/src/services/public/getSharedAlbum.service.ts` — extend response with `phase`, `stats: { guestCount, recentMatches, lastActivityAt }`. Compute `phase` from `album.canUpload`, `album.curating`, `album.delivered`, and timestamps. Compute `stats` with a single Prisma aggregate (count distinct guest sessions on `guest_uploads`/`face_searches`; max(`created_at`) for `lastActivityAt`).
- `apps/api/src/services/public/getSharedAlbumStats.service.ts` — **optional split** if the aggregate is heavy. New service, mirrors `BaseService` pattern (alias → validate → query → alias). Joi schema: `{ token: joi.string().required() }`. Cache with `CACHE_TTL.SHORT` (60s).
- `apps/api/src/routes/public.route.ts` — bind `GET /public/albums/:token` (already exists, just returns extended shape) and optionally `GET /public/albums/:token/stats`.
- `packages/event-sdk/src/types/public.ts` — add `phase: "collecting" | "curating" | "delivered"` and `stats` to `PublicAlbum` type.
- `apps/api/src/tests_native/services/public/getSharedAlbum.test.ts` — extend existing tests with phase-derivation cases and stats shape.

**Acceptance:** `/api/public/albums/demo` returns `phase` and `stats` with snapshot-stable shape. Demo album returns `phase: "collecting"`.

---

### Step 2 — `useSharedAlbumStats` + `useSharedAlbumPhase` hooks (client)

**Goal:** Thin React Query hooks the route and any sub-components can consume.

**Files:**

- `apps/client/app/hooks/share/useSharedAlbum.ts` — extract the implicit query from `sharedAlbum.tsx` into a hook. Returns `{ album, phase, stats, isLoading }`. Internally uses `fetchSharedAlbum`.
- `apps/client/app/hooks/share/useSharedAlbumStats.ts` — selects `stats` from the same query (avoids a second request). Exposed as a separate hook for composition.
- `apps/client/app/components/share/StatsStrip.tsx` — three glass cards: guests, recent matches, last activity. `md:` and above only.
- `apps/client/app/components/__tests__/StatsStrip.spec.tsx` — smoke test: renders three cards with formatted numbers; renders a skeleton when `isLoading`.

**Acceptance:** Visiting `/share/demo` on a desktop viewport shows three glass cards under the Hero. Mobile viewport hides them.

---

### Step 3 — Port `useLiveAlbum` (SSE reactions) to client

**Goal:** Bring real-time reaction updates that the PWA already has into the client.

**Files:**

- `apps/client/app/hooks/share/useLiveAlbum.ts` — copy from `apps/app/app/hooks/useLiveAlbum.ts`. Same EventSource wiring to `/api/public/albums/:id/events`. No changes needed beyond import paths.
- `apps/client/app/components/share/ReactionButton.tsx` — extracted heart button; calls `POST /api/public/albums/:token/images/:imageId/react` via Eden. Consumes optimistic update from `useLiveAlbum`.
- `apps/client/app/Images/ImageGridItem.tsx` — already has heart slot; wire it through `useLiveAlbum`-merged reactions when on `/share/:token` path.

**Acceptance:** Two browsers on `/share/demo`: reacting in one increments the count in the other within ~1s.

---

### Step 4 — Glass Hero responsive refactor

**Goal:** The existing Glass Hero in `sharedAlbum.tsx:225-279` becomes mobile-aware.

**Files:**

- `apps/client/app/routes/sharedAlbum.tsx` — extract the hero `<div>` into `apps/client/app/components/share/SharedAlbumHero.tsx`. Props: `{ album, phase, onFindMyFace, onContribute, onQuickContribute }`. Variants:
  - Mobile (`< sm`): single column, QR icon shrinks to 12×12, CTAs become a sticky bottom bar (`fixed bottom-0 inset-x-0 z-100`), phase pill in header.
  - Desktop (`md+`): current 2-col layout, QR icon 20×20, CTAs inline in hero.
- `apps/client/app/components/share/PhaseBadge.tsx` — new component, takes `phase` and renders the sage/amber/zinc pill.
- `apps/client/app/components/__tests__/SharedAlbumHero.spec.tsx` — extend the existing `sharedAlbumHero.spec.tsx` to assert phase pill and sticky CTA bar at mobile widths (use `matchMedia` mock).

**Acceptance:** Resizing the browser between mobile and desktop swaps the hero layout cleanly; phase pill shows the correct colour.

---

### Step 5 — Quick Contribute (mobile single-photo upload)

**Goal:** A mobile-only single-tap "Add this moment" affordance, separate from desktop `UploadManager`.

**Files:**

- `apps/client/app/components/share/QuickContribute.tsx` — `<input type="file" accept="image/*" capture="environment">` wrapped in a sage button. On change, calls `useUpload().addUploads(file, albumId, initialStatus, token)` with a single file. Shows a toast on success/failure. Only mounted at `< sm`; gated by `album.canUpload && phase === "collecting"`.
- `apps/client/app/routes/sharedAlbum.tsx` — render `<QuickContribute>` inside `SharedAlbumHero` mobile variant; keep the existing Contribute button + modal for `sm+`.
- `apps/client/app/components/__tests__/QuickContribute.spec.tsx` — fires `change` on the file input with a mock `File`, asserts `addUploads` is called with the right shape.

**Acceptance:** On mobile, a single tap opens the camera/gallery picker and uploads one photo without the full modal flow.

---

### Step 6 — Port semantic search + face review

**Goal:** Feature parity with the PWA on the unified route.

**Files:**

- `apps/client/app/components/share/SemanticSearchBar.tsx` — port of `apps/app/app/components/event/EventSearchBar.tsx`. Renders only when `album.settings.semantic_search_enabled`.
- `apps/client/app/components/share/FaceReviewCarousel.tsx` — port of `apps/app/app/components/event/EventFaceReview.tsx` and `apps/app/app/components/FaceReviewCard.tsx`. Shows after a successful selfie search with multiple candidates.
- `packages/ui/src/components/domain/SemanticSearchSuggestions.tsx` — new shared chip strip ("dancing", "cake cutting", "speeches") consumed by `SemanticSearchBar`.
- `apps/client/app/hooks/share/useSharedAlbumSearch.ts` — orchestrates selfie + semantic searches against `publicEventClient` (already in `apps/client/app/hooks/usePublicEventClient.ts`).

**Acceptance:** On `/share/demo` with `semantic_search_enabled`, typing "cake" filters the grid. Selfie search with multiple candidates triggers the face-review carousel.

---

### Step 7 — Port PWA infrastructure (manifest, service worker, install prompt)

**Goal:** `apps/client` becomes installable and offline-tolerant.

**Files:**

- `apps/client/vite.config.ts` — add `VitePWA` plugin mirroring `apps/app/vite.config.ts:14-38`. Same `NetworkFirst` runtime caching for `/api/public/albums/.*`. `registerType: "autoUpdate"`.
- `apps/client/public/manifest.json` — new file based on `apps/app/public/manifest.json`. Name updated to the host product name; theme color matches the client's sage/zinc palette.
- `apps/client/public/icons/` — copy `icon-192.svg` and `icon-512.svg` from `apps/app/public/icons/`.
- `apps/client/app/entry.client.tsx` (or equivalent bootstrap) — add `registerSW({ immediate: true })`.
- `apps/client/app/components/InstallPrompt.tsx` — port from `apps/app/app/components/InstallPrompt.tsx`. Mount in the root layout. Gate visibility behind `useLocation()` so it only shows on `/share/:token` (we don't want hosts seeing install prompts on the dashboard).
- `apps/client/app/components/share/OfflineFallback.tsx` — port from `apps/app/app/components/event/EventOfflineFallback.tsx`. Rendered by `sharedAlbum.tsx` when fetch fails and the cache is empty.

**Acceptance:** Visiting `/share/demo` on Chrome mobile shows the install prompt; installing creates a standalone PWA shortcut. Going offline still loads the cached album.

---

### Step 8 — Add `/e/:token` redirect on the API edge

**Goal:** Cheap hygiene for any QRs still in the wild, even though QR backwards-compat is officially waived.

**Files:**

- `apps/api/src/routes/public.route.ts` — add `GET /e/:token` returning `301` to `/share/:token` (or handle at reverse-proxy if simpler).
- Update marketing copy / README / `apps/docs/coolify-deployment-journey.md` to reflect the new single domain.

**Acceptance:** `curl -I /e/demo` returns `301 Location: /share/demo`.

---

### Step 9 — Deprecate `apps/app`

**Goal:** Remove the duplicate app and its build pipeline.

**Files:**

- Confirm all unique logic is ported (steps 3–7): `useLiveAlbum`, `useEventLogic`, `InstallPrompt`, `OfflineFallback`, `EventSearchBar`, `EventFaceReview`, `EventHostCta`, `EventGallery`, `FaceReviewCard`, `QrScanButton`, `GuestImageModal`.
- `git rm -r apps/app`.
- `package.json` — remove `start:app`, `dev:app`, and the PWA leg from `dev:all`.
- `bunfig.toml` — remove `@lumina/app` from workspace-exempt list.
- Coolify — decommission the `apps/app` static resource (`lumina-app.otagera.xyz`).
- `apps/docs/coolify-deployment-journey.md` — update section "The Guest App (PWA Frontend)" to "(Deprecated — consolidated into Client)".
- `README.md` — remove `apps/app` from the apps list.

**Acceptance:** Repo builds and deploys with `apps/app` removed; no broken imports; no dead Coolify resource.

---

## 4. File-by-file inventory (PWA → Client)

A complete mapping of every `apps/app` file and its destination.

### 4.1 To port

| Source (`apps/app/...`) | Destination (`apps/client/...` or `packages/...`) | Notes |
|---|---|---|
| `app/hooks/useLiveAlbum.ts` | `app/hooks/share/useLiveAlbum.ts` | EventSource SSE wiring; identical body |
| `app/hooks/event/useEventLogic.ts` | Split: search → `app/hooks/share/useSharedAlbumSearch.ts`; suggestions/face-review → `app/hooks/share/useFaceReview.ts`; live → `useLiveAlbum` | Don't port wholesale; this hook is a god-object |
| `app/components/InstallPrompt.tsx` | `app/components/InstallPrompt.tsx` | Add `useLocation()` gate to only show on `/share/:token` |
| `app/components/QrScanButton.tsx` | `app/components/share/QrScanButton.tsx` | Mobile entry point — sits on the landing page next to the link input |
| `app/components/GuestImageModal.tsx` | Merge into existing `app/Images/ImageModal.tsx` | Existing client modal is more capable; absorb the guest-only reaction UI |
| `app/components/FaceReviewCard.tsx` | `app/components/share/FaceReviewCard.tsx` | Single suggestion card |
| `app/components/event/EventFaceReview.tsx` | `app/components/share/FaceReviewCarousel.tsx` | Carousel wrapper around `FaceReviewCard` |
| `app/components/event/EventGallery.tsx` | Already covered by existing client grid + `ImageGridItem`; **drop** | Search/empty states need to be ported as small slots inside the route |
| `app/components/event/EventHostCta.tsx` | `app/components/share/HostCta.tsx` | "Want your own gallery?" CTA — gate on guest sessions, not authenticated hosts |
| `app/components/event/EventOfflineFallback.tsx` | `app/components/share/OfflineFallback.tsx` | Identical body |
| `app/components/event/EventSearchBar.tsx` | `app/components/share/SemanticSearchBar.tsx` | Wires the new `SemanticSearchSuggestions` chip strip |
| `app/components/event/EventSelfieAction.tsx` | Already handled by existing `SelfieSearchModal` in client; **drop** | Functionality already unified via shared `InAppCamera` |
| `app/routes/event.tsx` | Logic merged into `app/routes/sharedAlbum.tsx` | Source for the responsive refactor |
| `app/routes/home.tsx` | Link input + `QrScanButton` moved to `app/routes/welcome.tsx` (or the landing root) | Visible to guests who land at `/` without a token |
| `public/manifest.json` | `apps/client/public/manifest.json` | Rebrand `name` to the host product |
| `public/icons/icon-192.svg`, `icon-512.svg` | `apps/client/public/icons/...` | Asset copy |
| `vite.config.ts` (PWA block) | Merge into `apps/client/vite.config.ts` | See Step 7 |
| `app/utils/eden.ts` | Already exists in client | Verify the base URLs match |

### 4.2 To drop (not needed in client)

- `app/routes/not-found.tsx` — client has its own 404.
- `app/root.tsx` — replaced by client's root layout.
- `app/entry.client.tsx` — replaced by client's bootstrap (`registerSW` call added there).
- Anything under `apps/app/app/index.css` — design tokens are already in `packages/config/tailwind/theme.css`.

### 4.3 Already shared (no action)

- `packages/ui/src/components/domain/InAppCamera.tsx` — sole camera source of truth.
- `packages/ui/src/components/domain/Skeleton.tsx` — `SkeletonImageGrid` used by both.
- `packages/event-sdk/*` — `createPublicEventClient`, `useEventAlbum`, `useEventAlbumHighlights`, `useSelfieSearch`.

---

## 5. Lifecycle adaptation across breakpoints

How the three phases render across the three breakpoints.

| | Mobile (`< sm`) | Tablet (`sm`–`md`) | Desktop (`≥ md`) |
|---|---|---|---|
| **Collecting** | Phase pill in hero top-right · Quick Contribute as primary sticky bottom CTA · Find-My-Face as secondary · semantic search collapsed behind a search icon · live reactions visible | 2-col hero · Contribute + Find-My-Face inline · semantic search bar visible · stats strip hidden | Full Hero · 3-card stats strip · semantic search prominent · `BulkActionBar` (host only) · multi-file `UploadManager` |
| **Curating** | Banner above grid: "Your photographer is curating these photos." · Quick Contribute hidden · Find-My-Face still visible · grid filters to APPROVED only | Same banner · contribute button hidden | Same banner · stats strip continues to update · host sees pending count in `BulkActionBar` |
| **Delivered** | Phase pill shows date · "Download all" sticky bottom CTA (links to desktop client if mobile-zip not implemented) · Find-My-Face + semantic search promoted | "Download all" inline · semantic search at top | "Download all" prominent · stats strip becomes "final stats" snapshot · grid switches to magazine-bento variant for a high-fidelity feel |

Phase transitions never reload the page — they re-render off the same React Query cache when the host flips `curating`/`delivered` on the album record. SSE (`useLiveAlbum`) pushes the new phase to live viewers.

---

## 6. Accessibility checklist (per AGENTS.md)

Every step above must satisfy:

- [ ] Sticky mobile CTA bar uses `role="region"` + `aria-label="Guest actions"`.
- [ ] `QuickContribute` file input has `aria-label="Add a photo from your gallery"`.
- [ ] `PhaseBadge` uses `aria-label` describing the phase (badge text is decorative on small screens).
- [ ] `SemanticSearchSuggestions` chips are `<button type="button">` with `aria-pressed` reflecting active state.
- [ ] `FaceReviewCarousel` uses `role="region"` + `aria-roledescription="carousel"` + `aria-live="polite"` for the current suggestion text.
- [ ] Mobile Hero collapses to a `<header>` with the album name as the only `<h1>` per page.
- [ ] `InstallPrompt` is dismissible with Esc and traps focus only while visible.
- [ ] All new buttons inherit from `<Button>` or carry `.focus-ring` + `type="button"`.
- [ ] `prefers-reduced-motion` is respected on the sticky bar slide-in.

---

## 7. UX parity — making `/share/:token` feel native on mobile

- **Safe-area insets:** sticky bottom bar uses `pb-[env(safe-area-inset-bottom)]`; top hero uses `pt-[env(safe-area-inset-top)]` in standalone PWA display mode.
- **Touch targets:** all CTAs ≥ 44×44px; chip rows scroll horizontally with `snap-x` for thumbable navigation.
- **Glassmorphism on mobile:** `bg-white/80 backdrop-blur-xl` is preserved but `backdrop-blur` is disabled at `< 360px` (via `@media (max-width: 359px)`) where it degrades performance on older devices.
- **`rounded-control` (8px)** for all CTAs; **`rounded-tile` (16px)** for the hero card; **`rounded-card` (12px)** for stats and grid items. No ad-hoc radii.
- **Z-index discipline:** sticky bar = `z-100`; install prompt = `z-110`; modals = `z-300`; toast = `z-510`. All from the registered scale.
- **Theme colour:** PWA manifest `theme_color` matches the `--color-zinc-950` token so the status bar matches the hero on dark mode and inverts cleanly on light.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Client bundle size grows when PWA features are added | `vite-plugin-pwa` is small; semantic search bar lazy-loads. Track bundle delta in CI after step 7. |
| `react-router-dom` ↔ `wouter` migration loses behaviour | Don't migrate routing — only port components and hooks. The PWA's wouter usage dies with `apps/app`. |
| Service worker caches stale album data | `NetworkFirst` with 3s timeout already mitigates this. Bust on phase transitions via `useLiveAlbum`-driven `queryClient.invalidateQueries`. |
| Hosts on the same domain accidentally trigger the Install Prompt | Gate `<InstallPrompt>` mount on `useLocation().pathname.startsWith("/share")`. |
| `InstallPrompt` flickers on first paint of `/share/:token` | Defer mount until after first React Query response; suppress for 30s after dismiss via `localStorage`. |
| Lifecycle phase logic diverges from host UI (host dashboard shows different counts) | Compute `phase` in a single shared util in `packages/utils/src/album/phase.util.ts`; both `getSharedAlbumService` and the host dashboard service consume it. |
| Existing `apps/app` Coolify deployment outlives the migration | Add a maintenance banner on `/e/:token` two weeks before decommission pointing to `/share/:token`. |

---

## 9. Open questions (to resolve before Sprint A starts)

1. **Album model fields for phases** — do `albums.curating` and `albums.delivered` boolean columns exist, or do we derive purely from `canUpload` + dates? Check `packages/models/src/albums.model.ts`.
2. **Reactions storage** — confirm the public reactions endpoint exists; in PWA today it's `POST /api/public/albums/:token/images/:imageId/react`. If not, scaffold during step 3.
3. **Where do generated QR codes point right now?** — even though backwards-compat is waived, knowing the answer informs whether step 8's redirect is "nice-to-have" or "load-bearing for ~N% of traffic".
4. **Semantic search rate limit** — `/search/semantic/public` should move under `strictPublicRateLimit` regardless; do that during step 6.
5. **Home page scenario showcase** — the user asked whether the landing should showcase both wedding *and* social-event scenarios. Out of scope for this consolidation; tracked separately in `feature-roadmap-2026.md`. Decision needed: one shared Hero with a scenario toggle, or two stacked scenario sections.
6. **Download all on mobile** — defer to desktop link or implement client-side zip via JSZip (already a dep of the client)? Affects step 4's delivered-phase CTA.
7. **InstallPrompt copy** — current PWA copy says "Lumina"; new copy should match the rebranded product name.

---

## 10. Suggested sprint sequencing

| Sprint | Steps | Outcome |
|---|---|---|
| **A** | 1, 2 | Backend ships `phase` + `stats`. Desktop `/share/:token` gains stats strip. |
| **B** | 3, 4 | Live reactions on client. Glass Hero is mobile-aware. Phase pill ships. |
| **C** | 5 | Quick Contribute lands on mobile. PWA still alive in parallel. |
| **D** | 6 | Semantic search + face review on client. Feature parity reached. |
| **E** | 7 | Client is installable + offline-tolerant. PWA + Client functionally identical. |
| **F** | 8, 9 | Redirect ships. `apps/app` retired. |

Each sprint is independently mergeable and revertable. F is the only step that touches infrastructure outside the repo.

---

## 11. Northstar reminder

Throughout this work, every decision should be justified against the **Wedding Photographer** scenario:

> A photographer creates an album the morning of a wedding. Guests scan the QR on every table to contribute candid shots and Find-My-Face during the reception. After the event, the photographer curates the album (removing duplicates, approving guest contributions). The next morning, they mark the album as delivered, and the couple receives a polished, high-fidelity gallery they can browse, search by moment ("first dance"), download, and reshare with family — all from the same `/share/:token` URL, on any device.

If any UI variant or feature makes that story harder, it's wrong.

