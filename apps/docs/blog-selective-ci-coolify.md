# Selective CI Builds for a Monorepo with GitHub Actions + Coolify

> How I stopped rebuilding four Docker images on every commit — and the three annoying bugs that got in the way.

---

## The Setup

Lumina is a Bun monorepo with four separate services:

| Service | Language | What it does |
|---|---|---|
| `api` | Elysia JS (Bun) | REST API, auth, album management |
| `worker` | Bun | Background jobs, image processing |
| `dashboard` | React/Vite | Frontend client |
| `ai_service` | Python/FastAPI | Face recognition, CLIP semantic search |

Production runs on a single VPS managed by [Coolify](https://coolify.io) — a self-hosted PaaS that wraps Docker Compose.

---

## The Problem

Coolify's default behaviour when you connect it to a git repo is simple: on every push, run `docker compose build --no-cache` and restart. That works fine when you have one service. With four, it means:

- A one-line CSS fix in `apps/client` triggers a full Python pip install for the AI service
- The AI service installs PyTorch, InsightFace, and a CLIP model — that's several minutes and ~3 GB every single time
- Every build runs from scratch because of `--no-cache`

This hit me hard when the VPS ran completely out of disk space mid-deploy:

```
ERROR: failed to build: [Errno 28] No space left on device
```

The culprit was a BuildKit cache mount in the AI service Dockerfile:

```dockerfile
# This was accumulating gigabytes of pip wheels across every --no-cache deploy
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

The `--mount=type=cache` flag persists the cache between BuildKit runs — but Coolify's `--no-cache` flag bypasses the layer cache, not the mount cache. So the pip download cache kept growing without bound, never getting pruned. Fixed by switching to `--no-cache-dir`:

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

But the deeper fix was rethinking the whole build strategy.

---

## The Solution

Instead of letting Coolify build images on the VPS, I moved builds to GitHub Actions and had Coolify pull pre-built images from GHCR (GitHub Container Registry).

The flow:

```
git push → GitHub Actions → build only changed services → push to GHCR → ping Coolify webhook → Coolify pulls new images → restart containers
```

Each service gets its own image:
- `ghcr.io/otagera/lumina-api:latest`
- `ghcr.io/otagera/lumina-worker:latest`
- `ghcr.io/otagera/lumina-dashboard:latest`
- `ghcr.io/otagera/lumina-ai:latest`

Coolify's `docker-compose.yml` changes from `build:` to `image:` + `pull_policy: always`:

```yaml
# Before
api:
  build:
    context: .
    target: api

# After
api:
  image: ghcr.io/otagera/lumina-api:latest
  pull_policy: always
```

Now Coolify never builds anything — it only pulls.

---

## The Workflow

### 1. Detect which services changed

[`dorny/paths-filter`](https://github.com/dorny/paths-filter) diffs the push against the previous commit and outputs a boolean per service:

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      api:       ${{ steps.filter.outputs.api }}
      worker:    ${{ steps.filter.outputs.worker }}
      dashboard: ${{ steps.filter.outputs.dashboard }}
      ai:        ${{ steps.filter.outputs.ai }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # required — paths-filter needs full history to diff

      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            api:
              - 'apps/api/**'
              - 'packages/**'
              - 'package.json'
              - 'bun.lock'
            worker:
              - 'apps/worker/**'
              - 'packages/**'
              - 'package.json'
              - 'bun.lock'
            dashboard:
              - 'apps/client/**'
              - 'packages/**'
              - 'package.json'
              - 'bun.lock'
            ai:
              - 'apps/ai/**'
              - 'requirements.txt'
```

Note that `packages/**` is included for all JS services because shared packages live there — a change to a shared utility should rebuild anything that depends on it.

### 2. Conditional build jobs

Each service has its own job that only runs when its filter fires — or when you manually force a full rebuild:

```yaml
build-api:
  needs: changes
  if: needs.changes.outputs.api == 'true' || github.event.inputs.force_all == 'true'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Lowercase owner
      run: echo "OWNER=${GITHUB_REPOSITORY_OWNER,,}" >> $GITHUB_ENV

    - uses: docker/setup-buildx-action@v3
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - uses: docker/build-push-action@v6
      with:
        context: .
        target: api
        push: true
        tags: ghcr.io/${{ env.OWNER }}/lumina-api:latest
        cache-from: type=gha,scope=api
        cache-to:   type=gha,scope=api,mode=max
```

The GHA layer cache (`type=gha`) means even when a service does rebuild, layers like `bun install` are reused if `bun.lock` didn't change.

### 3. Deploy only if something actually built

The deploy job runs after all four build jobs, but only if at least one succeeded. The `always()` guard is required — without it, skipped jobs count as "failed" and would prevent deploy from running:

```yaml
deploy:
  needs: [build-api, build-worker, build-dashboard, build-ai]
  if: |
    always() && !failure() && !cancelled() &&
    (needs.build-api.result       == 'success' ||
     needs.build-worker.result    == 'success' ||
     needs.build-dashboard.result == 'success' ||
     needs.build-ai.result        == 'success')
  runs-on: ubuntu-latest
  steps:
    - name: Trigger Coolify redeploy
      run: |
        curl -fsSL -X GET "${{ secrets.COOLIFY_WEBHOOK_URL }}" \
          -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

Two GitHub secrets required:
- `COOLIFY_WEBHOOK_URL` — from Coolify app → **Webhooks tab** → Deploy Webhook URL
- `COOLIFY_TOKEN` — from Coolify → **Profile → API Tokens** (set scope to **deploy** only, 1 year expiry)

---

## Challenges Along the Way

### 1. VPS disk exhaustion from pip cache

Already described above. The short version: `--mount=type=cache` and `docker compose build --no-cache` are not friends. The cache mount persists across `--no-cache` runs and grows indefinitely. Switching to `--no-cache-dir` in the pip install fixed it.

Emergency cleanup when it happened: `docker system prune -af --volumes` on the VPS.

### 2. Vector config mounted as a directory

After fixing the disk issue, the log shipper (Vector) started throwing:

```
ERROR vector::cli: Configuration error. error=Is a directory (os error 21)
```

The `docker-compose.yml` had:

```yaml
volumes:
  - ./monitoring/vector.yaml:/etc/vector/vector.yaml:ro
```

The `timberio/vector` image already has `/etc/vector/` as a directory. When Docker bind-mounts a file to a path whose parent directory already exists inside the image, it creates the target as an empty *directory* instead of a file.

Fix: mount to a path that doesn't exist in the image:

```yaml
command: ["--config", "/opt/vector/vector.yaml"]
volumes:
  - ./monitoring/vector.yaml:/opt/vector/vector.yaml:ro
```

### 3. GHCR requires lowercase repository names

The workflow originally used `${{ github.repository_owner }}` directly in image tags:

```yaml
tags: ghcr.io/${{ github.repository_owner }}/lumina-api:latest
```

`github.repository_owner` preserves the casing of your GitHub username. Mine is `Otagera` — capital O. GHCR rejects any tag that isn't fully lowercase:

```
ERROR: failed to build: invalid tag "ghcr.io/Otagera/lumina-api:latest":
  repository name must be lowercase
```

GHA expressions have no built-in `toLower()`. The fix is a one-liner bash step using shell parameter expansion:

```yaml
- name: Lowercase owner
  run: echo "OWNER=${GITHUB_REPOSITORY_OWNER,,}" >> $GITHUB_ENV
```

Then reference `${{ env.OWNER }}` in the tags instead.

### 4. paths-filter silently returns false without full git history

On the first run, `dorny/paths-filter` was outputting `false` for everything — even though files had clearly changed. The cause: `actions/checkout@v4` defaults to `fetch-depth: 1` (shallow clone), so `paths-filter` couldn't find the base commit to diff against.

Fix: `fetch-depth: 0` in the checkout step of the `changes` job.

### 5. The Coolify webhook needs a Bearer token

The webhook URL in Coolify's Webhooks tab is labelled **"auth required"**. A plain `curl -X GET <url>` returns 401. You need a Coolify API token passed as a Bearer header:

```bash
curl -fsSL -X GET "$COOLIFY_WEBHOOK_URL" \
  -H "Authorization: Bearer $COOLIFY_TOKEN"
```

The API token lives at Coolify → Profile → API Tokens. Set scope to **deploy** only — no reason to give CI write access to anything else.

---

## The End Result

| Before | After |
|---|---|
| Every push rebuilds all 4 services | Only changed services rebuild |
| AI service pip install on every CSS fix | AI rebuilds only when `apps/ai/**` changes |
| Builds run on the VPS, consuming disk | Builds run on GitHub's runners |
| VPS disk exhaustion after a few weeks | VPS only pulls and runs pre-built images |
| ~8 min deploy for a typo fix | ~45 sec for a frontend-only change |

The `workflow_dispatch` with `force_all: boolean` input is the escape hatch — when you need a full rebuild without touching any source files, you can trigger it manually from the GitHub Actions UI.

---

## Secrets Checklist

| Secret | Where to get it |
|---|---|
| `COOLIFY_WEBHOOK_URL` | Coolify app → Webhooks tab → Deploy Webhook |
| `COOLIFY_TOKEN` | Coolify → Profile → API Tokens (scope: deploy) |

`GITHUB_TOKEN` is automatic — no secret needed for pushing to GHCR.

---

## Making GHCR Packages Public

After the first workflow run creates the packages, make them public so Coolify can pull without credentials:

GitHub profile → **Packages** → each `lumina-*` package → **Package settings → Change visibility → Public**

If you want to keep them private, add a `GHCR_TOKEN` secret and a `docker login` step to your `docker-compose.yml` pull process on the VPS.
