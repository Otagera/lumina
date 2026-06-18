# Homepage Coverage

Track which product features and use cases are represented on the marketing homepage (`/`).

Update status when a section ships: ✅ present · 🔄 planned/in-progress · ❌ not mentioned

---

## Features

| Feature | Homepage section | Status |
|---|---|---|
| Guest Upload (QR) | Hero copy, FeaturesSoft "Collect" | ✅ |
| Selfie Search (described) | FeaturesSoft "Find" | ✅ |
| Custom Themes | FeaturesSoft "Brand" | ✅ |
| BYOS Storage | FeaturesSoft "Own" | ✅ |
| Selfie Search (AI face match) | LivePreview "Try selfie search" | ✅ |
| Live Demo (interactive) | LivePreview + UseCaseSection CTAs | ✅ |
| Guest Downloads | — | ❌ |
| Album Analytics | — | ❌ |
| Reactions | — | ❌ |
| Live Display Mode | UseCaseSection "Parties" | ✅ |
| Smart Highlights Reel | UseCaseSection "Parties" | ✅ |
| Delivered Gallery | UseCaseSection "Weddings" | ✅ |
| Multi-contributor | UseCaseSection "Church & Media" | ✅ |
| Face Tagging / People | — | ❌ |
| Series / Recurring Events | UseCaseSection "Church & Media" | ✅ |
| Semantic Search (text) | — | ❌ |

---

## Use Cases

| Use Case | Homepage section | Demo token | Status |
|---|---|---|---|
| Weddings | UseCaseSection | `/share/demo` | ✅ |
| Parties / Birthdays | UseCaseSection | `/share/demo-party` | ✅ |
| Church & Media Teams | UseCaseSection | `/share/demo-church` | ✅ |
| Corporate / Conferences | — | — | ❌ |
| School / Graduation | — | — | ❌ |
| Sports & Community | — | — | ❌ |

---

## Demo Albums

| Token | Album | Phase | Theme |
|---|---|---|---|
| `demo` | Summer Wedding 2025 | delivered | wedding · playfair · #C8A97E |
| `demo-party` | Musa's Birthday Bash 🎉 | collecting | dark-luxe · dm-sans · #7C3AED |
| `demo-church` | Grace Community Church · June 2026 | collecting | minimal · inter · #1d4ed8 |

> Demo albums are served by `buildDemoAlbum` / `buildPartyDemoAlbum` / `buildChurchDemoAlbum` in
> `apps/api/src/services/public/getSharedAlbum.service.ts` when no real DB record exists for
> the token. Override by seeding an actual album with the matching `share_token`.
