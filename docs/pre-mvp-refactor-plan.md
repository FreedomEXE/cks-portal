# Pre-MVP Type Safety & RBAC Hardening Plan

You’re not wrong to be torn. Here’s the **ship-on-time** plan that gets you 80% of the safety/type benefits with ~20% of the work, and keeps a clean path to a fuller refactor **after MVP (by Sep 30, 2025)**.

---

## What to do **before MVP** (must-dos)
1. **Guard the riskiest edges only (4–6 endpoints)**
   - Pick: **auth/login/register**, **job/create**, **crew/assign**, **payments/quotes** (if any).
   - Add **runtime validation** + **typed DTO** just for these. Leave the rest for later.

2. **Minimum RBAC you can trust**
   - One enum, one permission map, one middleware. That’s it.
   - Enforce **allow-list** checks on those same critical endpoints.

3. **Typed request context + Result**
   - A tiny `AuthContext` type (user id, role) and a `Result<T>` union to standardize success/errors.

4. **Harden TS without breaking builds**
   - Turn on `"strict": true`. If it explodes, scope it to `src/api/**` for now via `tsconfig.build.json`.

5. **Output whitelisting**
   - For user/job payloads, **construct DTOs explicitly** (no `res.json(entity)`).

Everything else (full schema coverage, branded IDs everywhere, OpenAPI/tRPC, repo-wide Zod) → **post-MVP**.

---

## Copy/paste snippets (drop-in)

### 1. Minimal RBAC
```ts
// src/api/rbac.ts
export const Roles = ["ADMIN","SUPERVISOR","CONTRACTOR","CLIENT"] as const;
export type Role = typeof Roles[number];

const Can = {
  CREATE_JOB: ["ADMIN","SUPERVISOR"],
  ASSIGN_CREW: ["ADMIN","SUPERVISOR"],
  VIEW_ALL_JOBS: ["ADMIN","SUPERVISOR","CONTRACTOR"],
  // add 3–5 actions you actually call pre-MVP
} as const;

export function has(role: Role, action: keyof typeof Can) {
  return (Can[action] as readonly Role[]).includes(role);
}
```

```ts
// src/api/mw/authorize.ts
import type { Request, Response, NextFunction } from "express";
import { has } from "../rbac";

export function authorize(action: Parameters<typeof has>[1]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).auth?.role as string | undefined;
    if (!role || !has(role as any, action)) {
      return res.status(403).json({ ok: false, code: "FORBIDDEN" });
    }
    next();
  };
}
```

### 2. Tiny Result type
```ts
// src/api/types/result.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: "VALIDATION" | "FORBIDDEN" | "NOT_FOUND" | "ERROR"; message?: string };
```

### 3. One high-value endpoint “hardened” (pattern)
```ts
// src/api/routes/job.create.ts
import type { Request, Response } from "express";
import { z } from "zod";
import { authorize } from "../mw/authorize";
import type { Result } from "../types/result";

// region Types
const CreateJobReq = z.object({
  title: z.string().min(1),
  siteId: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});
type CreateJobReq = z.infer<typeof CreateJobReq>;

type JobDTO = {
  id: string;
  title: string;
  siteId: string;
  scheduledAt?: string | null;
  status: "NEW" | "SCHEDULED" | "IN_PROGRESS" | "DONE";
};
// endregion

export const createJobAuthorize = authorize("CREATE_JOB");

export async function createJobHandler(req: Request, res: Response) {
  const parsed = CreateJobReq.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(<Result<never>>{
      ok: false,
      code: "VALIDATION",
      message: "Invalid body",
    });
  }

  const job = await jobRepo.create(parsed.data); // your repo call

  const payload: JobDTO = {
    id: String(job.id),
    title: job.title,
    siteId: job.siteId,
    scheduledAt: job.scheduledAt ?? null,
    status: job.status,
  };

  return res.status(201).json(<Result<JobDTO>>{ ok: true, data: payload });
}
```

> Apply that exact pattern to **login/register**, **crew assign**, and **one read endpoint** (e.g., `GET /jobs/:id`). That’s enough coverage to slash risk.

---

## “Do it now” prompts for Codex/Claude (no new folders)

### Prompt A — pick & harden top endpoints
```
Scope: We’re pre-MVP. Do NOT add new folders. Edit in place.

1) Identify these files: login, register, job.create, crew.assign, job.getById.
2) In each file:
   - Add a small Zod schema block at top (body/params/query as needed).
   - Use safeParse and return 400 on fail with { ok:false, code:"VALIDATION" }.
   - Create an explicit DTO object for the response; no spreading DB entities.
   - Import and apply the authorize(action) middleware where appropriate.
3) Keep export names and routes unchanged.
Show me diff for each file when done.
```

### Prompt B — add minimal RBAC + Result
```
Create two small files if they don't exist yet:
- src/api/rbac.ts : Roles enum (string union), Can map, has(role, action).
- src/api/types/result.ts : Result<T> success/error union.

Then update only the endpoints we hardened to use Result<T> in their JSON returns.
```

### Prompt C — constrain TS strictness to API only
```
Add/modify tsconfig.build.json so "strict": true applies at least to src/api/**.
If project-wide strict breaks the build, scope it narrowly to the modified files.
```

---

## What to **defer to post-MVP**
- Full-schema coverage across all routes
- Branded IDs everywhere
- OpenAPI generation or tRPC end-to-end types
- Shared `contracts/` package
- Deep service/repo typing and generics cleanup
- Comprehensive test matrix

Create a **“Debt Register”** doc now with these bullets so they don’t get lost.

---

## Why this works
- You protect the **highest-risk paths** users actually hit.
- You standardize errors/payloads where it matters (fewer flaky debugging sessions).
- You avoid churn: **no folder moves**, no sweeping renames.
- You keep a straight runway to the full refactor after you ship.

---
