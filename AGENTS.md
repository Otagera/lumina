# AI Agent Guidelines - Anoda Facematch API

## Service Architecture Standard

All API services MUST follow this exact pattern. This is enforced and non-negotiable.

### Standard Service Pattern

Every service in `apps/api/src/services/` MUST follow this structure:

```
1. Import Joi and utilities from @lumina/utils
2. Define Joi validation schema
3. Define aliasSpec (request & response mappings)
4. Export service function with: alias → validate → business logic → alias
```

### Required Imports

```typescript
import { joi } from "@lumina/utils";
import { aliaserSpec, validateSpec } from "@lumina/utils";
// Import from lib or model for business logic
```

### Service Structure Template

```typescript
// 1. Validation Schema
const spec = joi.object({
  user_id: joi.string().required(),
  // ... other fields
});

// 2. Alias Specification
const aliasSpec = {
  request: {
    // Client-facing camelCase → Internal snake_case
    userId: "user_id",
  },
  response: {
    // Internal snake_case → Client-facing camelCase
    user_id: "userId",
  },
};

// 3. Service Function
export const service = async (data: any, dependencies?: any) => {
  // Step 1: Alias request (client → internal)
  const aliasReq = aliaserSpec(aliasSpec.request, data);

  // Step 2: Validate
  const params = validateSpec(spec, aliasReq);

  // Step 3: Business logic (call lib or model)
  const result = await someBusinessLogic(params, dependencies);

  // Step 4: Alias response (internal → client)
  const aliasRes = aliaserSpec(aliasSpec.response, result);
  return aliasRes;
};

export default service;
```

### ROUTES MUST NOT:

- Contain business logic (only: validate input → call service → return response)
- Make direct Prisma/database calls
- Import from `packages/models/` directly
- Have more than 50 lines of code (excluding imports)

### ROUTES MUST:

- Only handle HTTP concerns (status codes, headers)
- Call services for all business logic
- Be thin wrappers around services

### SERVICES MUST NOT:

- Contain HTTP-specific code (status codes, res.send, etc.)
- Import Express or Fastify request/response objects
- Skip validation or aliasing

### SERVICES MUST:

- Use Joi for input validation
- Use aliaserSpec for key mapping
- Call libs or models for data access
- Return plain objects (no HTTP response objects)

### Layers (MUST follow this flow):

```
Route → Service → Lib (optional) → Model → Database
```

### Anti-Patterns to AVOID:

```typescript
// ❌ WRONG: Direct Prisma in route
app.get("/users", async (req, res) => {
  const users = await prisma.users.findMany(); // BAD!
});

// ❌ WRONG: Business logic in route
app.post("/upload", async (req, res) => {
  // 100 lines of upload logic here - BAD!
});

// ❌ WRONG: Direct model import in route
import { createUser } from "../../../../packages/models/src/users.model.ts";

// ✅ CORRECT: Thin route
app.post("/users", async (req, res) => {
  const result = await createUser.service(req.body);
  res.json(result);
});
```

### Generating New Services

Use the service generator:

```bash
cd apps/api
bun run src/utils/scripts/service-generator.ts --name createUser --category auth
```

### Enforcement

This standard is enforced by:
1. BaseService class in `@lumina/utils/base.service`
2. Code reviews
3. AI agent instructions (this file)

### Key Files Reference:

- Base Service: `packages/utils/src/base.service.ts`
- Validation Utils: `packages/utils/src/specValidator.util.ts`
- Service Generator: `apps/api/src/utils/scripts/service-generator.ts`
- Example Service: `apps/api/src/services/auth/create.service.ts`

---

## Frontend Architecture Standard

All client-side code in `apps/client/`, `apps/app/`, and `packages/ui/` MUST follow these rules.

### Component Layers

```
Route → Hook → Service/API → Component
```

- **Routes** (`app/routes/*.tsx`): Compose hooks and components. No fetch calls, no business logic, no raw `fetch`/Eden calls inline. Target ≤ 200 lines.
- **Hooks** (`app/hooks/**/*.ts`): Encapsulate all React Query, mutations, derived state, and side effects. Routes call hooks; hooks call api modules.
- **Components** (`app/components/**/*.tsx`): Presentational. Receive data via props. May own local UI state (open/closed, hover) but no remote data fetching.
- **API modules** (`app/utils/api.ts`, `app/utils/eden.ts`): Type-safe wrappers around Eden / fetch. Return typed promises; never throw raw HTTP errors.

### Design Tokens (NON-NEGOTIABLE)

All radii, focus rings, and motion MUST go through tokens in `packages/config/tailwind/theme.css`.

| Token | Use | Value |
|---|---|---|
| `rounded-control` | Inputs, buttons, chips | 8px |
| `rounded-card` | Cards, panels, alerts | 12px |
| `rounded-tile` | Bento tiles, image thumbnails | 16px |
| `rounded-modal` | Modal containers, sheets | 20px |
| `.focus-ring` | Any focusable non-Button element | sage ring + offset |
| `.skip-link` | Skip-to-content link | hidden until focused |
| `.cv-tile` | Off-screen render skip | `content-visibility: auto` |

**DO NOT** use ad-hoc `rounded-[12px]`, `rounded-xl`, `rounded-2xl`, etc. Use the semantic token.

### Component Hierarchy

| Need | Use |
|---|---|
| Any clickable action | `<Button>` from `@lumina/ui/components/ui/button` |
| Text input | `<Input>` from `@lumina/ui/components/ui/input` |
| Modal | `<Modal>` wrapper (already focus-trapped, dismiss-on-Esc) |
| Card surface | `<Card>` standard wrapper |
| Heading | `<Heading level={1-6}>` |

Raw `<button>` is allowed ONLY for: bento grid cells, file picker triggers, dropdown items, and toggle chips that need pixel-precise positioning. Such buttons MUST include:
- `type="button"` (never default to `submit`)
- `aria-label` (if icon-only) or visible text
- `.focus-ring` utility OR explicit `focus-visible:ring-*` classes

### Accessibility (a11y) Rules

EVERY interactive element MUST be reachable by keyboard and announced to assistive tech.

1. **Icon-only buttons** require `aria-label` describing the action (e.g. `aria-label="Close"`, not `aria-label="X"`).
2. **Toggle buttons** use `aria-pressed={boolean}`. Coerce non-boolean state with `!!value`.
3. **Switches** use `role="switch"` + `aria-checked={boolean}`.
4. **Disclosure buttons** (menus, dropdowns) use `aria-expanded`, `aria-haspopup`, and `aria-controls` referencing the panel's `id`.
5. **Dialogs / modals** require `role="dialog"`, `aria-modal="true"`, and an accessible name via `aria-label` or `aria-labelledby`.
6. **Regions** with contextual content (bulk action bars, side panels) use `role="region"` + `aria-label`.
7. **Skip link**: every top-level layout must include `<a href="#main-content" className="skip-link">` and a `<main id="main-content" tabIndex={-1}>`.
8. **Reduced motion**: never bypass the `@media (prefers-reduced-motion: reduce)` reset in `theme.css`.
9. **Form fields**: use the shared `<Input>` (which renders `<label>` + `aria-describedby` for errors/hints). If raw `<input>`, pair with `<label htmlFor>`.

### Type Safety Rules

1. NO `any` in props, hook returns, or API responses. Use `unknown` + narrowing if the shape is truly dynamic.
2. API response types live in `app/types/index.ts` and are imported by hooks AND components.
3. Optional backend fields that may be `null` are typed `T | null`; use `?? undefined` when forwarding to a prop typed `T | undefined`.
4. NEVER suppress with `@ts-ignore`. Use `@ts-expect-error <reason>` only for generated/auto types.

### Route File Limits

- Routes MUST be ≤ 200 lines.
- Routes > 200 lines MUST extract logic into `app/hooks/<route>/` and JSX sections into `app/components/<route>/`.
- A route file should read like a table of contents: a few `useX()` calls, then JSX composition.

### Anti-Patterns to AVOID

```tsx
// ❌ WRONG: Raw fetch in route
export default function Album() {
  const [data, setData] = useState();
  useEffect(() => { fetch("/api/album").then(...) }, []); // BAD
}

// ❌ WRONG: Icon button without label
<button onClick={onClose}><X size={20} /></button>

// ❌ WRONG: Ad-hoc radius
<div className="rounded-[14px] rounded-2xl">

// ❌ WRONG: any in props
function Card(props: any) { ... }

// ✅ CORRECT: Hook-driven route
export default function Album() {
  const { data, isLoading } = useAlbum(albumId);
  if (isLoading) return <SkeletonGrid />;
  return <AlbumView album={data} />;
}

// ✅ CORRECT: Labelled icon button
<button type="button" onClick={onClose} aria-label="Close dialog">
  <X size={20} />
</button>

// ✅ CORRECT: Semantic radius
<div className="rounded-card">
```

### Key Files Reference (Frontend):

- Theme tokens: `packages/config/tailwind/theme.css`
- Standard Button: `packages/ui/src/components/ui/button.tsx`
- Standard Input: `packages/ui/src/components/ui/input.tsx`
- Modal wrapper: `apps/client/app/components/Modal.tsx`
- Shared types: `apps/client/app/types/index.ts`
- API surface: `apps/client/app/utils/api.ts`
