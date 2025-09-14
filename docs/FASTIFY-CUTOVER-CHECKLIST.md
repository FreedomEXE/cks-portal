MVP CUTOVER CHECKLIST

Purpose: Track Fastify migration status, dev commands, quick tests, and parity criteria so we can safely complete the refactor and archive legacy code.

Environments
- API (Fastify): http://localhost:5000
- CKS Hub Testing Interface: http://localhost:3004 (frontend)
- MVP app (login-first): http://localhost:5183 (frontend)

Dev Commands (root)
- API (refactor): npm run dev:api
- Hub tester (refactor FE): npm run dev:hub
- MVP FE (existing): npm run dev:mvp

Enable Mock Auth (for local dev)
- Env: DEV_MOCK_AUTH=1
- Optional headers:
  - x-mock-user: e.g., MGR-001 or ADM-001
  - x-mock-role: manager | admin
  - x-mock-caps: comma-separated caps (defaults include dashboard:view, profile:view, profile:update, directory:view, catalog:view)

Quick Test URLs
- Health: GET http://localhost:5000/health
- Swagger: http://localhost:5000/api/docs
- Manager dashboard health: GET http://localhost:5000/api/manager/dashboard/health
- Manager profile: GET http://localhost:5000/api/manager/profile
- Manager directory: GET http://localhost:5000/api/manager/directory?type=contractor&limit=10
- Manager services: GET http://localhost:5000/api/manager/services?status=active&limit=10
- Manager orders: GET http://localhost:5000/api/manager/orders?status=pending&limit=10

Example curl (with mock auth)
curl -H "x-mock-role: manager" -H "x-mock-user: MGR-001" -H "x-mock-caps: dashboard:view,profile:view,profile:update,directory:view,catalog:view,services:view,orders:view" http://localhost:5000/api/manager/profile

Domains — Status (Fastify)
- Transport: Express\n- Domains: catalog, profile, directory, services, orders, reports, support\n- Next: Fastify migration (post-MVP)\n
