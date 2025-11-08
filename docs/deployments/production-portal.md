 # CKS Portal – Production Deployment (Render + Vercel)
 
 This document captures the exact working settings that match our repo and previous build logs.
 
 ## Backend (Render)
 
 - Service: `cks-portal` (Web Service)
 - Runtime: Node (Node 20.x via `.nvmrc`)
 - Region: Oregon (US West)
 - Instance: Starter is OK to begin
 
 Build & Start
 - Build Command:
   corepack enable && pnpm i --frozen-lockfile && pnpm --filter @cks/policies build
 - Start Command:
   pnpm -C apps/backend exec tsx server/index.ts
 - Health Check Path: `/healthz` (our server also exposes `/api/health`)
 
 Environment Variables
 - DATABASE_URL = postgresql://… (Render Postgres or external)
 - DATABASE_SSL = true
 - CLERK_SECRET_KEY = sk_test_…
 - ALLOWED_ORIGINS = https://portal.ckscontracting.ca
 - HOST = 0.0.0.0 (optional)
 - PORT = (Render provides automatically)
 
 Domain
 - Add custom domain: `api.portal.ckscontracting.ca`
 - Follow Render DNS instructions (CNAME to onrender.com host)
 - Wait for SSL to issue (5–15 min)
 
 Smoke Test
 - curl https://api.portal.ckscontracting.ca/api/health → 200 JSON
 
 ## Frontend (Vercel)
 
 Project
 - Root Directory: `apps/frontend`
 - Framework: Vite
 
 Install Command
 - corepack enable && pnpm i --frozen-lockfile
 
 Build Command
 - pnpm -C ../../auth build && pnpm -C ../../packages/ui build && pnpm -C ../../packages/domain-widgets build && pnpm build
   (We must build workspace packages before the app so Vite can resolve `@cks/auth` et al.)
 
 Output Directory
 - dist
 
 Environment Variables (Production)
 - VITE_CLERK_PUBLISHABLE_KEY = pk_test_…
 - VITE_API_URL = https://api.portal.ckscontracting.ca/api
 - HUSKY = 0 (optional; avoids running git hooks during CI)
 
 Domain
 - Add: `portal.ckscontracting.ca`
 - If already attached to a different project (e.g., website), transfer it to this portal project
 - Complete DNS per Vercel prompt (usually CNAME to `cname.vercel-dns.com`)
 
 ## Clerk
 - Allowed Origins: https://portal.ckscontracting.ca
 - Authorized Redirect URLs: https://portal.ckscontracting.ca and https://portal.ckscontracting.ca/*
 
 ## After First Deploy
 1) Monitor Render logs for start errors (ESM/CJS). Our start uses `tsx` with ESM and is known-good.
 2) Verify frontend loads, login appears, and no CORS errors.
 3) Run the MVP smoke test: `docs/test-plans/MVP-smoke-2025-11-07.md`.
 
 ## Auto-deploy
 - Render: On Commit (enabled)
 - Vercel: Auto builds on push to main
 
 Notes
 - If you prefer `node dist/index.js` on the backend, you must keep the repo fully ESM and compile with `tsc` accordingly. The current production start uses `tsx` to avoid ESM/CJS runtime mismatches seen in earlier logs.
 
