# CKS Portal Documentation

Welcome to the CKS Portal documentation. This directory contains all essential project documentation for immediate production needs.

## 📁 Current Documentation Structure

### 🎯 **Essential Documents** (`/docs/project/`)
- **[CKS-Portal-Project-Outline-PRD.md](./CKS-Portal-Project-Outline-PRD.md)** - **MAIN DOCUMENT** - Complete project overview, requirements, and specifications
- **[AGENTS.md](./AGENTS.md)** - Context and handoff guide for new agents
- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Development standards, coding conventions, and architectural principles
- **[STYLEGUIDE.md](./STYLEGUIDE.md)** - UI/UX styling guidelines and component standards
- **[HUB_TEMPLATES_AND_PROVISIONING.md](./HUB_TEMPLATES_AND_PROVISIONING.md)** - Role templates, provisioning flow, and data binding
- **[AUTH_AND_ID_MAPPING.md](./AUTH_AND_ID_MAPPING.md)** - CKS ID as auth identifier, routing, and session
- **[API_SURFACE_V1.md](./API_SURFACE_V1.md)** - Minimal, consistent API patterns for hubs
- **[CREW_HUB_SPEC.md](./CREW_HUB_SPEC.md)** - Detailed Crew hub spec (fields, behavior, API)
- **[CREW_QA_CHECKLIST.md](./CREW_QA_CHECKLIST.md)** - QA checklist for Crew hub MVP
 - **[CENTER_HUB_SPEC.md](./CENTER_HUB_SPEC.md)** - Detailed Center hub spec (fields, behavior, API)
 - **[CENTER_QA_CHECKLIST.md](./CENTER_QA_CHECKLIST.md)** - QA checklist for Center hub MVP
 - **[COMMUNICATIONS_SPEC.md](./COMMUNICATIONS_SPEC.md)** - Shared News/Inbox/Support data shapes and API
 - **[API_ERRORS_AND_ENVELOPES.md](./API_ERRORS_AND_ENVELOPES.md)** - Standard response envelope and error codes

### 📋 **Session Tracking** (`/docs/`)
- **CURRENT SESSION YYYY-MM-DD.md** - Detailed session progress and handoff notes

### 🖼️ **Assets** (`/docs/images/`)
- **cks-logo.png** - Main CKS company logo
- **CKS-Portal-Style-Black.png** - CKS Portal branding assets

### 📦 **Historical Documents** (`/docs/project/ARCHIVE/`)
- Legacy documentation and completed phase-specific files
- ADRs and QA checklists from previous development phases

## 🚀 Quick Start for New Agents

1. **Start Here**: Read [AGENTS.md](./AGENTS.md) for essential context
2. **Full Details**: Review [CKS-Portal-Project-Outline-PRD.md](./CKS-Portal-Project-Outline-PRD.md) for complete requirements
3. **Development**: Follow [BEST_PRACTICES.md](./BEST_PRACTICES.md) for coding standards
4. **Latest Progress**: Check the most recent `CURRENT SESSION` file in `/docs/`

## 🎯 Key Project Info

### **What We're Building**
Role-based service delivery management system with 6 independent hubs (Admin, Manager, Contractor, Customer, Center, Crew).

### **Current Status** 
~40-45% complete. Frontend hubs functional with template data. Backend integration and user creation system needed for MVP.

### **MVP Goal**
Fully functional app where Admin creates users → they immediately work → core business operations function end-to-end.

### **ID System**
MGR-XXX, CON-XXX, CUS-XXX, CEN-XXX, CRW-XXX, ADM-XXX format determines login and hub access.

## 📚 Additional Resources

- **Tech Stack**: React + TypeScript + Vite + Tailwind (Frontend), Node.js + Express/Fastify + PostgreSQL (Backend)
- **File Locations**: Hub components in `frontend/src/pages/Hub/{Role}/Home.tsx`
- **Database Schema**: `Database/schema.sql`

---

*Property of CKS © 2025 - Manifested by Freedom*
