# CKS Portal

Complete business management portal with hub-based architecture for different user roles.

## 🚀 Quick Start

```bash
# Backend
cd backend/server
npm install
npm run dev

# Frontend  
cd frontend
npm install
npm run dev
```

## 📚 Documentation

All comprehensive documentation has been moved to the [`/docs`](./docs/) directory:

- [Complete Documentation Index](./docs/index.md)
- [Refactoring Architecture Guide](./docs/project/CKS_PORTAL_REFACTORING_DOCUMENTATION.md)
- [Project Requirements](./docs/project/CKS-Portal-PRD.md)
- [Setup Instructions](./docs/project/)

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Fastify + TypeScript  
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Hub System**: 6 independent hubs (Admin, Manager, Contractor, Customer, Center, Crew)

## 🎯 Hub System

Each user role has a completely independent hub:
- **Admin Hub** - System administration
- **Manager Hub** - Operations management  
- **Contractor Hub** - Business client interface
- **Customer Hub** - Center management
- **Center Hub** - Facility coordination
- **Crew Hub** - Field worker interface

---

*Property of CKS © 2025 - Manifested by Freedom*