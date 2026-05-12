## Code Review

### Architecture & Strengths
The monorepo structure is solid. The service layer pattern (Route → Service → Lib → Model → DB) is well-enforced and the AGENTS.md enforcement via git hooks is a smart guardrail. The aliaser/validator pattern keeps request/response mapping clean and testable.

---

### Issues Worth Fixing

**1. Auth Race Condition (`signup.service.ts`)**
```typescript
// guestSessionId is referenced but not destructured from params
const { email, password } = validateSpec(spec, aliasReq);
// ...
if (guestSessionId) { // ← this is undefined, never extracted
```
`guestSessionId` needs to come from `aliasReq` before validation, or be destructured from `validateSpec` output.

**2. Missing `resetPasswordService` import in `auth.route.ts`**
```typescript
// Line ~80 calls resetPasswordService but it's not imported
await resetPasswordService(body);
// The import at top only brings in: forgotPasswordService, loginService, etc.
```

**3. Dead code in `validate-services.ts`**
The function `validateRoute` has unreachable code after the first `return` statement — there's a second block of `whereClauses` and a `return` that never executes.

**4. `pictures.route.ts` references undefined variables**
```typescript
// publicPicturesRoutes references these but they're never imported:
// verifyShareTokenService, config, fs, path
```

**5. `deleteAlbumsByUserId` in `albums.model.ts`**
The `prisma` variable inside `$transaction` shadows the outer `prisma` import — the inner one is the transaction client but the code then calls `prisma.albums.findMany` outside the transaction using the outer client. Scoping is inconsistent and error-prone.

**6. Reaction model returns wrong shape**
```typescript
// reactions.lib.ts
const reaction = await addReaction({...});
return aliaserSpec(aliasSpec.response, {
  reaction_id: reaction.reaction_id, // ← Prisma returns `id`, not `reaction_id`
```
The Prisma schema has `id UUID` not `reaction_id`.

**7. Unsafe `require()` in `thumbnail.service.ts`**
```typescript
const sharp = require("sharp"); // CommonJS require in an ESM module
```
Should be a top-level import.

**8. `getPresignedUrlService` — key collision**
```typescript
const key = params.key || `${Date.now()}-${params.file_name}`;
// `params.key` is never in the Joi spec, so this always falls through
// but `key` is also defined in the aliasSpec.request — it's never aliased in
```

**9. N+1 query in `moderatePicturesService`**
```typescript
for (const img of imagesWithContext) {
  await queueServices.emailQueueLib.addJob(...) // sequential awaits in a loop
  await prisma.notifications.create(...)         // N database calls
}
```
Both should be batched — `createMany` for notifications and a single `addJob` with all emails.

**10. Unhashed token storage in `passwordResets.model.ts`**
Reset tokens are stored as plaintext. They should be hashed (SHA-256 is fine — these are random tokens, not passwords) to limit exposure from a DB breach.

**11. `useAlbumImages` hook has a stale type reference**
```typescript
// Line: page?.data?.imagesInAlbum?.map((ia: ImagesInAlbum) => ia.images)
// ImagesInAlbum is imported from types but the local variable is also named ImagesInAlbum
// The hook references the type correctly but the local `ImagesInAlbum` in the map callback
// shadows it — TypeScript won't catch this at runtime but it's confusing
```

**12. Guest upload quota bypass is incomplete**
```typescript
// uploadPictures.service.ts
uploadResult = await uploadPicturesService({
  userId: album.created_by || undefined, // ← charges host's quota correctly
```
But in `uploadPublic.service.ts`, the `uploadPicturesService` call passes the host's `userId`, which logs compute usage against the host. The comment in `UploadContext.tsx` says "Quota is charged to the host" — but there's no cap on how many times a guest can trigger this, so a malicious guest can exhaust a host's quota. There's a 100-image-per-session cap in `uploadPictures.service.ts` but it only applies to authenticated uploads.

---

### Minor Issues
- `removeImagesInAlbumService` is misnamed — it updates status, doesn't remove images
- `logQueue.json` is committed to the repo (should be in `.gitignore`)
- `HTTP_STATUS_CODES` has both `INTERNAL_SERVER_ERROR: 500` and `INTERNAL_ERROR` used in routes (inconsistent naming)
- Several routes catch errors with `error?.statusCode` but custom errors only set `statusCode` on some subclasses — `OperationError` base class has it as optional, leading to silent 400s instead of correct status codes

---

## On the Client/App Split

**Is it wise?** Architecturally yes — the intent is clear: `apps/client` is the host dashboard (complex, auth-required, data-heavy) and `apps/app` is the guest-facing event experience (public, mobile-first, performance-critical). That's a legitimate split. **The problem is execution.**

### Current Issues

**The app is a thin wrapper around the client's patterns.** `apps/app/app/routes/event.tsx` is 200+ lines doing what the client does, with a different UI coat. You're maintaining two API layers (`eden.ts` exists in both), two routing setups, two build configs, and two component trees for what shares significant logic.

**The app has no shared component library contract.** It imports from `@lumina/ui` but then defines its own `InAppCamera` and local state patterns. The shared UI package exports `ImageGrid` and `ImagePreviewModal` but the app builds its own camera/upload UX from scratch.

**The Vite proxy config in `apps/app` proxies to the same API.** So both apps talk to the same backend — they could share far more.

---

### What to Do

**1. Promote the `apps/app` experience, not just style it differently**

The app should own the full guest journey: arrive via QR → find my photos → react → download → optionally become a host. Right now it does steps 1-3 but the journey ends. Add a "Host your own event" CTA that deep-links to signup with the album context preserved.

**2. Extract a shared `@lumina/event-sdk` package**

```
packages/event-sdk/
  src/
    hooks/
      useEventAlbum.ts    # shared query logic
      useSelfieSearch.ts  # shared face search
    api/
      public.client.ts    # typed API client (no duplication)
```

Both the client's `SharedAlbum` page and the app's `EventPage` do nearly identical things. The hooks `useQuery(['album', token])` and the `selfieSearchService` call are copy-pasted.

**3. The app needs PWA treatment, not just a Vite app**

For a guest experience accessed via QR code, install-to-homescreen and offline capability matter enormously. Add a service worker, a web manifest, and cache the album data. A guest arriving at a wedding reception with poor signal currently gets a blank screen.

```json
// apps/app/public/manifest.json
{
  "name": "Lumina Event",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#7CA982"
}
```

**4. Fix the camera UX — it's the core interaction**

`InAppCamera.tsx` uses `react-webcam` which ships ~50kb and has well-known iOS Safari quirks with `facingMode: "user"`. The face-search flow is: tap button → modal opens → take selfie → API round-trip → results. On a mid-range phone on 4G that's 3-5 seconds of blank waiting. You need:

- Optimistic UI: show the captured selfie immediately while searching
- A skeleton/shimmer state for results, not just a spinner
- The face oval guide is decorative right now — make it functional (only enable capture when a face is detected client-side using the [`face-api.js`](https://github.com/vladmandic/human) or even a simple brightness heuristic)

**5. Decouple the app's routing from React Router's full bundle**

The app only has 3 routes (`/`, `/e/:token`, `*`). React Router v7 with its SSR config is overkill. The `react-router.config.ts` sets `ssr: false` but still ships the full router. A simpler hash-based or manual router would meaningfully reduce the bundle for a mobile-first app.

**6. Reactions need WebSocket, not just polling**

`useLiveAlbum.ts` opens a WebSocket per client but the server's `elysia.ts` WS handler only publishes when a user reacts through the app — not through the client dashboard. The `REACTION_ADDED` event in `events.util.ts` publishes to Redis, which bridges to the SSE stream — but the app uses WebSocket, not SSE. These two transports are out of sync. Unify to SSE (simpler, works through proxies, no upgrade required) or properly route both through Redis pub/sub.