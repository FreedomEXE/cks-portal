# CKS Portal

Monorepo housing both the frontend web application and backend service(s) for the CKS Portal platform.  
Goal: Provide a unified multi‑role experience (center, crew, contractor, customer, manager, admin) while enforcing strict role isolation and clean domain boundaries.

---

## Table of Contents
- [Vision Snapshot](#vision-snapshot)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Clone & Install](#clone--install)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Scripts](#scripts)
- [Development Workflow](#development-workflow)
  - [Branching Model](#branching-model)
  - [Commit Convention](#commit-convention)
  - [Pull Requests](#pull-requests)
- [Workspaces / Shared Code](#workspaces--shared-code)
- [Type Safety & Role Modeling](#type-safety--role-modeling)
- [Testing](#testing)
- [Linting & Formatting](#linting--formatting)
- [Deployment](#deployment)
- [Versioning & Releases](#versioning--releases)
- [Roadmap (Short-Term)](#roadmap-short-term)
- [Tech Debt Overview](#tech-debt-overview)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Vision Snapshot
Create a modular, extensible portal where each role’s surface area (data fetching, tabs, navigation) is isolated yet composed within a unified shell.  
Key principles:
- Role isolation & least privilege
- Predictable routing (explicit route map)
- Typed discriminated unions for role data
- Incremental modularization (no “big bang” rewrite)
- Testable pure logic for role resolution

See `VISION.md` for deeper intent (if present).

---

## Repository Structure
```
.
├─ frontend/          # React (or other) client application
│  ├─ src/
│  ├─ public/
│  └─ package.json
├─ backend/           # API server (tech TBD: Node/Express, Nest, Python, etc.)
│  ├─ src/
│  └─ package.json / pyproject.toml / requirements.txt
├─ shared/            # (Optional) Shared types/utilities used by both
├─ infra/             # (Optional) Infrastructure as code, deployment configs
├─ scripts/           # Repo management / dev helper scripts
├─ docs/              # Additional documentation (architecture, ADRs, etc.)
├─ VISION.md          # Strategic direction (optional)
├─ TECH_DEBT.md       # Known cleanup items
├─ TASKS_NEXT.md      # Ordered tactical tasks
├─ package.json       # (Optional) root workspace manifest if using JS workspaces
├─ .gitignore
└─ README.md
```

---

## Technology Stack
(Adjust this section to the actual stack.)
- Frontend: React + TypeScript + Vite (placeholder)
- Backend: Node.js + Express/Nest (placeholder) OR (Python/FastAPI)
- Package management: npm / pnpm / yarn (choose one)
- Testing: Vitest / Jest (frontend), Jest / Pytest (backend)
- Linting: ESLint + Prettier
- Types: Shared TypeScript interfaces in `shared/` (if using JS both sides)
- Auth: (TBD)
- Persistence: (TBD: Postgres? Prisma? Sequelize? etc.)

---

## Getting Started

### Prerequisites
- Node.js (LTS) (e.g. 20.x)
- (If backend not Node) Python 3.11 / or other runtime
- Git
- Package manager: pnpm (recommended) or yarn/npm
- Optional: Docker (if running DB/services locally)

### Clone & Install
```bash
git clone https://github.com/FreedomEXE/cks-portal.git
cd cks-portal

# If using workspaces (example with pnpm)
pnpm install
# Or install separately:
cd frontend && npm install
cd ../backend && npm install
```

### Environment Variables
Create `.env` files (never commit secrets):
```
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```
```
# backend/.env
PORT=3000
DATABASE_URL=postgres://...
JWT_SECRET=change_me
```
Provide non-sensitive sample values in `.env.example`.

### Running Locally
Simple (frontend + backend separate terminals):
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```
If using a root script:
```bash
npm run dev        # orchestrates both (see Scripts)
```

---

## Scripts
(Example — adapt to your reality.)
Root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:backend\" \"npm:dev:frontend\"",
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:backend": "pnpm --filter backend dev",
    "lint": "pnpm --recursive lint",
    "typecheck": "pnpm --recursive typecheck",
    "test": "pnpm --recursive test"
  }
}
```

Frontend `package.json` (example):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Backend `package.json` (example):
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

---

## Development Workflow

### Branching Model
- main: Always shippable.
- feature/<scope>-<short-description>
- chore/, fix/, refactor/ prefixes optional but encouraged.

### Commit Convention
(Adopt Conventional Commits if desired)
```
feat(manager): add manager profile tabs
fix(auth): correct token refresh timing
refactor(profile): extract role resolution function
chore(deps): bump react to 19.x
```

### Pull Requests
- Keep focused (one feature/fix).
- Include a short “Context” & “Testing” section.
- Reference roadmap item / issue if exists.

---

## Workspaces / Shared Code
If using npm/pnpm/yarn workspaces:
- Root `package.json` includes:
```json
{
  "private": true,
  "workspaces": ["frontend", "backend", "shared"]
}
```
This allows:
- Single install of node_modules at root
- Cross-package imports via symlinked paths
- Centralized lint/test scripts

If you have a VS Code `.code-workspace`, it’s purely for editor settings and is unrelated to Node workspaces (see explanation below).

---

## Type Safety & Role Modeling
Role subject union (example):
```ts
export type RoleKind = 'center' | 'crew' | 'contractor' | 'customer' | 'manager' | 'admin';
```
- Each role gets a distinct data interface + fetch hook (e.g. `useManagerProfile`).
- Avoid a giant “any” profile object.

Planned:
- Pure function for role resolution: `resolveSubject(context): SubjectDescriptor`
- Strict switch statements (exhaustive checking) to render role-specific UI.

---

## Testing
Categories:
- Unit: Pure logic (role resolution, data shaping)
- Component: Frontend UI via testing library
- Integration: Backend endpoints with in-memory DB / test containers
- Contract (optional): Shared schema tests between frontend & backend

Run all:
```bash
npm test
```

---

## Linting & Formatting
- ESLint for static analysis
- Prettier (in ESLint) for formatting
- Run:
```bash
npm run lint
npm run typecheck
```

---

## Deployment
(Placeholder – document build & deploy steps)
- Backend container image: (TBD)
- Frontend static build: `frontend/dist`
- Env injection strategy: (TBD)
- CI/CD: (GitHub Actions pipeline to be added)

---

## Versioning & Releases
- Semantic Versioning (SemVer): vMAJOR.MINOR.PATCH
- Create annotated tags:
```bash
git tag -a v2.0.0 -m "Release 2.0.0"
git push --tags
```
- Optionally generate changelogs later.

---

## Roadmap (Short-Term)
1. Repo initialization & baseline docs
2. Introduce route map file
3. Define role subject types & discriminated unions
4. Split MyProfile logic into smaller modules
5. Manager profile stabilization (typed props)
6. Per-role data hooks skeleton
7. Add lint/type/test baseline
(Expand in `VISION.md` / `TASKS_NEXT.md`.)

---

## Tech Debt Overview
See `TECH_DEBT.md`. Initial highlights:
- Overloaded profile dispatcher
- LocalStorage heuristic risks leakage
- Missing route constants
- Untyped manager profile props
- Folder names previously had spaces

---

## Contributing
- Fork or branch from main
- Run lint & tests before pushing
- Keep PRs small, descriptive

---

## Security
- No secrets committed
- Rotate API keys regularly
- Add a SECURITY.md if external contributions expected

---

## License
(Choose a license and add LICENSE file — e.g., MIT, Apache-2.0, proprietary internal.)

---

## Contact / Maintainers
- Primary maintainer: @FreedomEXE
- (Add others as they join)