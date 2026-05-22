# `tests_native/` — Bun test guide & triage notes

This directory holds the **native** API test suite: integration-style specs
that exercise real Elysia routes against the real test database, using Bun's
built-in test runner (`bun:test`). No live HTTP server is started — requests
are dispatched in-process via `app.handle(new Request(...))`.

## What "native" means here

| | |
|---|---|
| Test runner | `bun:test` (`bun test ...`) |
| HTTP layer | None. `app.handle(request)` runs the Elysia pipeline in-process and returns a `Response`. |
| Database | Real Postgres pointed at the `test` env (`apps/api/.env`, `NODE_ENV=test`). Each spec creates its own users/albums and tears them down. |
| Queues | Stubbed by the queue layer when `NODE_ENV=test` — workers don't actually run. Look for `[QUEUE-TEST] Skipping job enqueue ...` lines in the log output. |
| File storage | `LocalProvider` writes to `apps/api/src/uploads/`. R2 is bypassed in test env. |

## File layout

```
tests_native/
  test-utils.ts          # shared helpers: getApp, req, parseRes, setupAuth
  fixtures/test.jpg      # real JPEG for upload / sharp tests
  <feature>.spec.ts      # route-level integration tests
  <feature>-extended.spec.ts   # secondary scenarios for the same feature
  <service>.service.spec.ts    # service-level unit tests (may use mocks)
```

## Anatomy of a spec

Every route-level spec follows the same shape:

```ts
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getApp, parseRes, req, setupAuth } from "./test-utils";

describe("Feature Routes (Native)", () => {
  let app: any;
  let user: Awaited<ReturnType<typeof setupAuth>>;

  beforeAll(async () => {
    app = await getApp();          // builds the Elysia app once per file
    user = await setupAuth(app);   // signs up a fresh user, returns cookie + token
  });

  afterAll(async () => {
    // delete created rows so the run is idempotent
  });

  it("does the thing", async () => {
    const res = await app.handle(
      req.post("/api/v1/things", { name: "x" }, { Cookie: user.cookie }),
    );
    const body = await parseRes(res);
    expect(res.status).toBe(HTTP_STATUS_CODES.CREATED);
    expect(body.data.name).toBe("x");
  });
});
```

### `test-utils.ts` cheat sheet

- **`getApp()`** → fresh `createElysiaApp()` instance. Cheap to call per file.
- **`req.get/post/put/patch/delete(path, body?, headers?)`** → builds a
  `Request` against `http://localhost`. JSON body + `Content-Type` are set for
  you. Pass cookies via the `headers` arg: `{ Cookie: user.cookie }`.
- **`parseRes(res)`** → safely parses JSON (handles double-stringified bodies)
  and falls back to text.
- **`setupAuth(app)`** → signs up a random user, returns `{ email, password,
  cookie, token, authHeader, userId }`. Tear down the user in `afterAll`.

### Process & ordering

All specs run in a **single Bun process**, file by file (roughly alphabetical
order). There is no per-file isolation: module caches, singletons, and any
`mock.module(...)` calls persist for the rest of the run. Plan accordingly —
this is the source of most surprise failures (see "Gotchas" below).

---

## How to run

```bash
cd apps/api && bun test                      # full suite
cd apps/api && bun test src/tests_native/auth.spec.ts
cd apps/api && bun test -t "session threshold"   # filter by test name
```

---

# Gotchas

Practical lessons learned while triaging the suite. Most failures fall into
one of these buckets.

## `mock.module()` gotchas

### Path is relative to the **test file**, not the service-under-test

The spec at `src/tests_native/foo.spec.ts` reaches `packages/config/...` via
**four** `..` segments, NOT five. Copying the import path from the service file
(which lives one directory deeper) silently makes the mock a no-op — Bun does
not warn when the path resolves to a non-existent module.

```ts
// ❌ Wrong — service uses this path, but spec file is one level shallower
mock.module("../../../../../packages/config/src/db.config.ts", () => ({ ... }));

// ✅ Correct — relative to apps/api/src/tests_native/foo.spec.ts
mock.module("../../../../packages/config/src/db.config.ts", () => ({ ... }));
```

### Mocks leak globally — there is no `restore()`

`mock.module()` mutates Bun's module cache for the rest of the process. There
is no documented "unmock" API. If a spec mocks `joi`, `prisma`, `storage`, or
any singleton, **every subsequent spec sees the stub**.

Symptoms:
- `storage.upload is not a function` in unrelated tests → an earlier spec
  replaced the `storage` module with a partial stub.
- `Joi.string().optional is not a function` → an earlier spec mocked `joi`
  with an incomplete chain.
- `queueServices.imageOptimizationQueueLib is undefined` → an earlier spec
  replaced `queueServices` with `{ emailQueueLib: {...} }`.

### Preferred pattern: monkey-patch + restore

For singletons (`prisma`, `storage`, `queueServices`), import the real module
and patch the methods you need, restoring in `afterAll`:

```ts
import prisma from "../../../../packages/config/src/db.config.ts";

const originals = { findUnique: prisma.images.findUnique };

beforeAll(() => {
  (prisma.images as any).findUnique = async () => ({ /* fixture */ });
});
afterAll(() => {
  (prisma.images as any).findUnique = originals.findUnique;
});
```

This works for default-exported objects and named-exported objects whose
properties are functions. It does **not** work for `const`-named exports
(those are read-only ESM bindings); for those, refactor the test to exercise
the underlying primitive (e.g. mock `prisma.images.updateMany` instead of the
const `moderateImagesQuery` that wraps it).

### When you must use `mock.module()`

For `node_modules` packages (`sharp`, `joi`, ...) you have no choice. Two
options to limit blast radius:
1. Use a **`Proxy`-based stub** that responds to any method with a self-chain
   (handles unknown `.optional()`, `.email()`, `.min()`, etc.).
2. Prefer running the real dependency against fixture data
   (`src/tests_native/fixtures/test.jpg` exists for this).

`thumbnail.service.spec.ts` is the reference for option 2.

---

## Elysia / cookie gotchas

### Guest session persistence requires the `Cookie` header

The `guestPlugin` reads `guestSessionId` from cookies, not from request bodies.
Tests that need to maintain a guest identity across requests must pass it via
the `Cookie` header on every `app.handle(...)` call:

```ts
const guestCookie = `guestSessionId=${crypto.randomUUID()}`;
await app.handle(req.post(url, { key }, { Cookie: guestCookie }));
```

See `public.spec.ts` ("session threshold") for the canonical example.

### Status-code mapping flows through `validateSpec`

`validateSpec` throws `BadRequestError` (400). Routes whose `catch` block
defaults to `UNAUTHORIZED` (401) — e.g. `/login` — will surface 400 if a
schema regex rejects the input. When asserting 401 in an auth test, ensure
the test payload **passes schema validation** so the route reaches the
auth-failure branch (use `"WrongPassword1!"`, not `"wrong-password"`).

---

## Upload deduplication

`uploadPublic.service.ts` deduplicates by file hash. Tests that need to hit
the per-session quota (20 uploads) must produce 20 **unique** buffers:

```ts
const unique = Buffer.concat([
  baseBuffer,
  Buffer.from(`__salt_${i}_${crypto.randomUUID()}`),
]);
```

Otherwise `incomingCount` stays at 0 and the quota gate is never reached.

---

## Schema requirements that changed

`POST /api/v1/images` and `POST /api/v1/reactions` now require `albumId`.
Test setup must create an album before uploading; pass `albumId` in the
request body.

---

## Constant names

The error-status constants are `HTTP_STATUS_CODES.BAD_REQUEST`,
`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`. There is no
`BADREQUEST` — typos resolve to `undefined`, which serializes to `null` and
matches no real status code. Grep for `BADREQUEST` before assuming a test
is exercising the 400 branch.
