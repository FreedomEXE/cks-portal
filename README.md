# CKS Portal

Monorepo for the CKS Portal web application (frontend + backend + shared packages). The app powers role‑based hubs for Admin, Manager, Customer, Contractor, Crew, Center, and Warehouse.

This repository uses pnpm workspaces and TypeScript across the stack.

## Quickstart
- Prereqs: Node 20+, pnpm 10+
- Install: `pnpm install`
- Start frontend only: `pnpm dev:frontend`
- Start backend only: `pnpm dev:backend`
- Start all (UI packages + frontend): `pnpm dev:full`

Frontend runs on Vite; backend uses Fastify. Clerk provides authentication.

## Environment
Create `apps/frontend/.env` (Vite requires `VITE_` prefix). Minimum:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/hub
VITE_CLERK_AFTER_SIGN_UP_URL=/hub

# Loader – custom animated logo
VITE_LOADER_SVG=/portal-icon.svg     # default if unset
# VITE_LOADER_COLOR=#111827           # optional stroke color
# VITE_LOADER_SIZE=160                # optional size (px)
# VITE_LOADER_FORCE_VECTOR=false      # true = force simple spinner
```

For backend, see `apps/backend/` README (Fastify + Postgres). Migrations live in `database/migrations` and scripts under `apps/backend/scripts`.

## Loader Customization
The global loading overlay prefers an SVG path animation driven by Framer Motion.

- Default: `/portal-icon.svg` (bundled in `apps/frontend/public`)
- Override with `VITE_LOADER_SVG` to point to any SVG asset or inline XML
- If no SVG resolves and `VITE_LOADER_FORCE_VECTOR=true`, a simple vector spinner renders as a fallback

Related files:
- `apps/frontend/src/components/GlobalLoader.tsx`
- `apps/frontend/src/components/LogoLoader.tsx`
- `apps/frontend/public/portal-icon.svg`

## Workspace Layout
- `apps/frontend` – React 18 + Vite + SWR + Clerk
- `apps/backend` – Fastify API with Clerk auth and Postgres
- `apps/gateway` – Lightweight gateway (optional)
- `auth` – Shared auth UI/logic used by the frontend
- `packages/*` – Shared UI, policies, and domain widgets
- `database` – SQL migrations
- `tests` – Playwright end‑to‑end tests

## Common Scripts
Root scripts (see `package.json`):
- `pnpm dev:frontend` – run the Vite frontend
- `pnpm dev:backend` – run the Fastify backend
- `pnpm dev:full` – start UI packages and frontend together
- `pnpm build` – build all workspaces
- `pnpm test:e2e` – run Playwright tests

Frontend scripts (see `apps/frontend/package.json`):
- `pnpm -F @cks/frontend dev` – run the app
- `pnpm -F @cks/frontend build` – production build

## Deployment
Typical steps to deploy the frontend as static assets:
- `pnpm -F ./apps/frontend build`
- Upload `apps/frontend/dist` to your static host (or serve via the gateway)

Ensure the environment variables above are present on the host. The loader uses `/portal-icon.svg` by default, so it works even if `VITE_LOADER_SVG` is not set.

## Contributing
- Use pnpm and Node 20+
- Keep changes scoped and incremental
- Follow existing code style; TypeScript preferred

## License
Proprietary – internal CKS use.

