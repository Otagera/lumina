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
