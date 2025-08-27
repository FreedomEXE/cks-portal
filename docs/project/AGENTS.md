# CKS Portal - Agent Context & Handoff Guide

*This document provides essential context for new Claude agents joining the CKS Portal development project.*

## 🎯 Quick Project Summary
**CKS Portal** is a role-based service delivery management system. CKS acts as an outsourced service provider for contractors, handling service delivery to the contractor's existing customers through a secure web platform with 6 independent hubs.

## 🏗️ Current Status (~40-45% Complete)
- **✅ Frontend**: All 6 role hubs implemented with template data
- **🚧 Backend**: API architecture exists but needs integration
- **🚧 Database**: Schema created but relationships need implementation
- **❌ Authentication**: Custom ID system (MGR-XXX, CON-XXX, etc.) needs Clerk integration

## 🚀 Immediate Priorities for MVP
1. **Admin User Creation**: Connect Admin Hub forms to create functional users
2. **Backend Integration**: Replace template data with real database queries
3. **ID-Auth System**: Integrate custom IDs with Clerk authentication
4. **Core Workflows**: Ordering system, reporting system, service requests

## 🏢 Business Model (Key for Development)
- **Contractors** outsource service delivery to CKS
- **Customers** are contractor's existing clients who receive services
- **Centers** are physical locations where services are performed
- **Both Customers AND Centers** can place orders
- **CKS Crew** perform actual work, managed by **CKS Managers**
- **CKS Admin** creates all users and manages the system

## 🖥️ Hub Data Model (Critical Understanding)
**IMPORTANT**: Only the **Admin Hub** accesses real database data directly.

**All other 5 role hubs** (Manager, Contractor, Customer, Center, Crew) are **USER-SPECIFIC TEMPLATES**:
- Each user who logs in sees their own personalized data
- Template data is replaced with user-specific information based on their role and relationships
- For example: `mgr-001` sees only centers/crew assigned to them, `cen-005` sees only their facility data
- Currently showing template data for development/testing purposes

## 🆔 ID System (Critical to Understand)
- **MGR-XXX** = Managers
- **CON-XXX** = Contractors  
- **CUS-XXX** = Customers
- **CEN-XXX** = Centers
- **CRW-XXX** = Crew
- **ADM-XXX** = Admin

*These IDs become login credentials and determine hub access.*

## 🎨 Hub System (6 Independent Hubs)
Each role has a completely isolated hub with specific functionality:

### **Admin Hub** (Black) - System Management
- Create users of any type → they immediately work
- 12-tab unified directory for entity management
- Order and report oversight
- System administration functions

### **Manager Hub** (Blue) - Operations Oversight  
- Oversee multiple centers and crews
- Place orders on behalf of centers
- Triage reports from centers
- Multi-center operational views

### **Center Hub** (Orange) - Facility Operations
- Create reports for operational issues
- Request services/supplies (prominent "New Request" CTA)
- View center activity and crew assignments
- Access training and procedures

### **Contractor Hub** (Green) - Business Client Interface
- View assigned customers and centers  
- Confirm orders from customers/centers
- Operational oversight of customer relationships

### **Customer Hub** (Yellow) - Center Management
- View centers tied to organization
- Initiate service/supply requests
- Operational visibility into centers

### **Crew Hub** (Red) - Field Worker Interface
- View assignments and center context
- Access training and procedures
- Basic work schedule and task management

## 🔧 Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express/Fastify (evaluating both) + PostgreSQL
- **Auth**: Clerk (needs custom ID integration)
- **Deployment**: Vercel (frontend) + Render (backend)

## 📁 Key File Locations
- **Hub Components**: `frontend/src/pages/Hub/{Role}/Home.tsx`
- **Backend Routes**: `backend/server/hubs/{role}/routes.ts`, `backend/server/resources/`
- **Database Schema**: `Database/schema.sql`
- **Database Pool**: `Database/db/pool.ts`
- **Main Documentation**: `docs/project/CKS-Portal-Project-Outline-PRD.md`

## 🔑 Test Login Credentials for Playwright Testing
Use these credentials to test each hub with automated testing:

- **Admin Hub**: `Freedom_exe` / `Fr33dom123!`
- **Manager Hub**: `mgr-000` / `CksDemo!2025`
- **Contractor Hub**: `con-000` / `CksDemo!2025`
- **Customer Hub**: `cus-000` / `CksDemo!2025`
- **Center Hub**: `cen-000` / `CksDemo!2025`
- **Crew Hub**: `crw-000` / `CksDemo!2025`

*Note: All non-admin hubs use the same password. These are template accounts for testing.*

### ▶️ Playwright UI Scripts (Repo Root)
- Install browsers once: `npm run playwright:install`
- Run a simple login check (Center hub): `npm run test:ui:login:center`
- Aggregated sample run: `npm run test:ui`

Notes:
- Ensure frontend (`frontend:5173/5183`) and backend (`backend/server:5000`) dev servers are running.
- Scripts execute Node-based Playwright helpers in the repo root (e.g., `test-center-login.js`).

## ⚠️ Important Development Notes
- **Complete Hub Independence**: No shared components between hubs for security
- **Template Data**: Currently using mock data, needs replacement with real DB queries
- **MVP Focus**: Core business operations must work for shipping
- **No Data Migration**: All users created fresh via Admin Hub

## 🎯 MVP Definition: "Ready to Ship"
A fully functional app where:
1. Admin creates users → they can immediately use the system
2. Ordering system works end-to-end (Centers/Managers → Admin oversight)
3. Reporting system functional (Centers create → visible to appropriate roles)
4. Service requests process completely
5. Role-based access controls data properly

## 📊 Success Metrics
- Admin can create a new center user → that user can immediately log in and place an order
- Center creates a report → assigned Manager can see and respond to it
- Manager places order on behalf of center → Admin can process it
- All role hubs show appropriate data only (secure data isolation)

## 🔄 Session Tracking System
This project uses dated session files (`docs/CURRENT SESSION YYYY-MM-DD.md`) to track detailed progress. Always check the latest session file for the most recent context and accomplishments.

### Latest Sessions
- 2025-08-27: Global Catalog implemented, requests flow (Customer/Center → Contractor approval → Manager scheduling) wired across backend + hubs. See `docs/CURRENT SESSION 2025-08-27.md`.

## ✅ Next Tasks (Handoff)
- Database package polish (Claude):
  - Use commonjs or compiled output for `Database/` and include its TS in backend tsconfig.
  - Remove backend duplicate schema; keep `Database/schema.sql` canonical.
  - Verify `/test-db` and DB-backed endpoints under tsx.
- Migrations & seeds (Claude): scaffold `Database/migrations` and `Database/seeds`.
- Counts in order lists (Claude): add totals to API so UI badges aren’t page-limited.
- Admin Catalog CRUD (Claude): item create/update/delete; non-admin remains read-only.
- Warehouse hub scaffold (Claude): add `backend/server/hubs/warehouse/routes.ts` with basic buckets.
- Tests/CI (Claude): Playwright smokes, GitHub Action for type-check/lint/build.
- Frontend polish (This agent): manager order detail overlay, dashboard badges, better empty/skeleton states, toasts, optional deep links, table filters.

## 🧭 Claude Prompt Starters
- Database finalize: “Switch Database to commonjs or compile to dist; include Database TS in backend tsconfig; remove backend duplicate schema; confirm `/test-db` works; scaffold migrations/seeds; update session notes.”
- Counts API: “Add `{ totals: { pending, approved, archive } }` to customer/center/contractor/manager list endpoints without breaking `{ success, data }`.”
- Admin Catalog CRUD: “Implement `/api/admin/catalog/items` CRUD with soft-delete; keep non-admin read-only; update docs and brief usage notes.”

## 🚨 Common Pitfalls to Avoid
- Don't assume payment processing is needed (it's not for MVP)
- Don't try to create shared components between hubs (security isolation required)
- Don't assume data migration from "CKS Brain" (it was just inspiration)
- Don't use URL constructor for API paths (use string concatenation)

---

*This guide should give you enough context to contribute effectively. For detailed requirements, see the main Project Outline & PRD document.*
