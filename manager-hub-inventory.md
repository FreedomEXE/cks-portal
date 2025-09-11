# Manager Hub Inventory

## File inventory (with code snippets + dependencies)

### frontend\src\pages\Hub\Manager\Home.tsx
<details><summary>First 50 lines</summary>

```tsx
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Manager Hub - FULLY INDEPENDENT)
 * 
 * Description: Complete Manager hub dashboard with all functionality in one file
 * Function: Manager landing page with navigation, profile, reports, and news
 * Importance: Critical - Primary interface for manager users with full feature set
 * Connects to: Manager API, Manager authentication, Manager session management
 * 
 * Notes: 100% self-contained - no external component dependencies.
 *        Includes hardcoded Page styling, NavCards, NewsPreview, and Profile tabs.
 *        Uses Manager-specific API endpoints and authentication.
 *        All Manager hub functionality consolidated for template clarity.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useManagerData from './hooks/useManagerData';
import { setManagerSession, getManagerSession } from './utils/managerAuth';
import { buildManagerApiUrl, managerApiFetch } from './utils/managerApi';
import ManagerLogoutButton from './components/LogoutButton';
import ReactDOM from 'react-dom';
import EcosystemView from './components/EcosystemView';

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

type ManagerSection = 'dashboard' | 'profile' | 'services' | 'contractors' | 'assign' | 'orders' | 'reports' | 'support';

export default function ManagerHome() {
  const navigate = useNavigate();
  const { username = '' } = useParams();
  const state = useManagerData();
  
  // UI State Management
  const [activeSection, setActiveSection] = useState<ManagerSection>('dashboard');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState(0);
  const [reqBucket, setReqBucket] = useState<'needs_scheduling'|'in_progress'|'archive'>('needs_scheduling');
  const [requests, setRequests] = useState<any[]>([]);
```
</details>
- API calls: `${base}/reports?${q}&limit=25`, `${base}/feedback?${q}&limit=25`, `${base}/reports/${encodeURIComponent(id)}`, `${base}/reports/${repDetail.report.report_id}/status`, `${base}/reports/${repDetail.report.report_id}/comments`, `${base}/feedback/${encodeURIComponent(id)}`, `/api/support/tickets`, `${baseApi}/manager/clear-activity?code=${encodeURIComponent(code)}`, `${base}/manager/centers?code=${encodeURIComponent(code)}`, `${base}/manager/customers?code=${encodeURIComponent(code)}`
- DB refs: `'`, `Photo`
- TS types: `for`, `NewsItem`, `ManagerSection`
- External deps: `react`, `react-router-dom`, `react-dom`

### frontend\src\pages\Hub\Manager\index.tsx
<details><summary>First 50 lines</summary>

```tsx
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (ManagerHub - FULLY INDEPENDENT)
 * 
 * Description: Manager hub router with complete independence from shared components
 * Function: Routes all Manager hub functionality through single Home component
 * Importance: Critical - Entry point for complete Manager hub system
 * Connects to: Manager Home component only, Manager authentication, Manager API
 * 
 * Notes: 100% self-contained routing with no external dependencies.
 *        All Manager functionality consolidated into Home component.
 *        Uses Manager-specific authentication and session management.
 *        Perfect template for other hub architectures.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerHome from './Home';

export default function ManagerHub() {
  return (
    <Routes>
      {/* All Manager functionality in single Home component */}
      <Route path="/" element={<ManagerHome />} />
      <Route path="profile" element={<ManagerHome />} />
      <Route path="dashboard" element={<ManagerHome />} />
      <Route path="reports" element={<ManagerHome />} />
      <Route path="news" element={<ManagerHome />} />
      
      
      {/* Legacy routes redirect to home */}
      <Route path="contractors" element={<ManagerHome />} />
      <Route path="centers" element={<ManagerHome />} />
      <Route path="crew" element={<ManagerHome />} />
      <Route path="services" element={<ManagerHome />} />
      <Route path="documents" element={<ManagerHome />} />
      <Route path="support" element={<ManagerHome />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

```
</details>
- DB refs: `'`
- External deps: `react`, `react-router-dom`

### frontend\src\pages\Hub\Manager\utils\managerApi.ts
<details><summary>First 50 lines</summary>

```ts
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * managerApi.ts
 * 
 * Description: Manager-specific API utilities for backend communication
 * Function: Builds URLs and handles fetch requests for Manager hub endpoints
 * Importance: Critical - Central API communication layer for Manager hub
 * Connects to: Manager backend API, Clerk authentication, Manager data hooks
 * 
 * Notes: Uses dedicated Manager API base URL for complete backend separation.
 *        Includes Manager-specific authentication headers and error handling.
 *        Isolated from other hub API calls for security.
 */

/**
 * Manager API base configuration
 * Uses separate endpoint for Manager hub isolation and security
 */
const MANAGER_DEV_PROXY_BASE = '/api/manager';
const MANAGER_RAW_API_BASE = import.meta.env.VITE_MANAGER_API_URL || MANAGER_DEV_PROXY_BASE;
export const MANAGER_API_BASE = MANAGER_RAW_API_BASE.replace(/\/+$/, "");

export function buildManagerApiUrl(path: string, params: Record<string, any> = {}) {
  // Build relative URL first
  let url = MANAGER_API_BASE + path;
  
  // Add query parameters if any
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      searchParams.set(k, String(v));
    }
  }
  
  const queryString = searchParams.toString();
  if (queryString) {
    url += '?' + queryString;
  }
  
  return url;
}

// Return Clerk user id for Manager authentication
function getManagerClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
```
</details>

### frontend\src\pages\Hub\Manager\utils\managerAuth.ts
<details><summary>First 50 lines</summary>

```ts
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * managerAuth.ts
 * 
 * Description: Manager-specific authentication and role validation utilities
 * Function: Validates manager access permissions and handles role checking
 * Importance: Critical - Security layer for Manager hub access control
 * Connects to: Clerk authentication, Manager role validation, session management
 * 
 * Notes: Manager-specific version of getRole with additional security checks.
 *        Ensures only authenticated managers can access Manager hub.
 *        Handles manager role persistence in sessionStorage.
 */

// Manager-specific role extraction and validation
export function getManagerRole(user: any, headers?: Record<string, string | null | undefined>) {
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') {
    const role = raw.toLowerCase();
    // Only return role if it's manager
    if (role === 'manager') return role;
  }
  
  // Allow header fallback for manager role only
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr && String(hdr).toLowerCase() === 'manager') {
    return 'manager';
  }
  
  console.debug('[getManagerRole] Manager role not found', { raw, header: hdr });
  return null;
}

// Validate that user has manager role access
export function validateManagerRole(user: any): boolean {
  const role = getManagerRole(user);
  let isValidManager = role === 'manager';

  // Dev/MVP fallback: allow session-mapped role
  if (!isValidManager) {
    try {
      const fallback = (typeof sessionStorage !== 'undefined') ? (sessionStorage.getItem('me:lastRole') || sessionStorage.getItem('manager:lastRole')) : null;
      if ((fallback || '').toLowerCase() === 'manager') isValidManager = true;
    } catch { /* ignore */ }
  }

```
</details>

### frontend\src\pages\Hub\Manager\hooks\useManagerData.ts
<details><summary>First 50 lines</summary>

```ts
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * useManagerData.ts
 * 
 * Description: Hook for fetching and managing manager-specific profile data
 * Function: Fetches manager profile from Manager API with fallbacks for offline/dev modes
 * Importance: Critical - Primary data source for Manager hub
 * Connects to: Manager API endpoints, localStorage for fallbacks, Clerk for auth
 * 
 * Notes: Manager-specific version of useMeProfile with dedicated API endpoints.
 *        Handles manager authentication and data validation.
 *        Provides stub data when Manager API is unavailable.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { buildManagerApiUrl, managerApiFetch } from "../utils/managerApi";
import { useUser } from '@clerk/clerk-react';
import { validateManagerRole } from '../utils/managerAuth';

type ManagerState = {
  loading: boolean;
  error: string | null;
  kind: string;
  data: any;
  _source?: string; // Internal diagnostic
};

export function useManagerData() {
  const { user } = useUser();
  const [state, setState] = useState<ManagerState>({ loading: true, error: null, kind: "manager", data: null });
  const didInitialFetchRef = useRef(false);

  const fetchManagerData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      
      // Check for URL param overrides (dev/testing)
      const params = new URLSearchParams(window.location.search);
      let codeOverride = params.get('code') || undefined;
      
      // Extract manager ID from URL path (e.g., /MGR-001/hub)
      const pathMatch = window.location.pathname.match(/\/(MGR-\d+)\/hub/i);
      if (pathMatch && pathMatch[1]) {
        codeOverride = pathMatch[1].toUpperCase();
        console.debug('[useManagerData] extracted manager ID from path:', codeOverride);
      }
```
</details>
- DB refs: `"`, `'`
- TS types: `ManagerState`
- External deps: `react`, `@clerk/clerk-react`

### frontend\src\pages\Hub\Manager\components\EcosystemView.tsx
<details><summary>First 50 lines</summary>

```tsx
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React, { useEffect, useState } from 'react';

type NodeType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew';

type EcosystemNode = {
  id: string;
  name: string;
  type: NodeType;
  stats?: { customers?: number; centers?: number; crew?: number };
  children?: EcosystemNode[];
};

export default function EcosystemView({ code }: { code: string }) {
  const [ecosystem, setEcosystem] = useState<EcosystemNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const baseApi = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api');
        const res = await fetch(`${baseApi}/manager/ecosystem?code=${encodeURIComponent(code)}`, { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || json?.success === false) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setEcosystem(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load ecosystem');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  }

  function badge(text: string, color: string) {
```
</details>
- API calls: `${baseApi}/manager/ecosystem?code=${encodeURIComponent(code)}`
- DB refs: `'`
- TS types: `NodeType`, `EcosystemNode`
- External deps: `react`

### frontend\src\pages\Hub\Manager\components\LogoutButton.tsx
<details><summary>First 50 lines</summary>

```tsx
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Manager Hub - FULLY INDEPENDENT)
 * 
 * Description: Manager-specific logout button component with session cleanup
 * Function: Handles user logout with Manager-specific session management
 * Importance: Critical - Secure logout functionality for Manager hub
 * Connects to: Universal logout component with Manager hub styling
 * 
 * Notes: Uses the universal logout component for consistent behavior
 *        across all hubs while maintaining Manager-specific appearance.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function ManagerLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearManagerSessionData = () => {
    const managerKeys = [
      'manager:session',
      'manager:lastCode',
      'role',
      'code',
      'me:lastRole',
      'me:lastCode'
    ];

    managerKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
```
</details>
- DB refs: `'`
- TS types: `LogoutButtonProps`
- External deps: `@clerk/clerk-react`, `react-router-dom`, `react`

### frontend\src\pages\Hub\Manager\components\NewsPreview.tsx
<details><summary>First 50 lines</summary>

```tsx
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * NewsPreview.tsx (Manager Hub - FULLY INDEPENDENT)
 * 
 * Description: Manager-specific news widget with demo fallback data
 * Function: Displays recent news and updates relevant to managers
 * Importance: Medium - Provides contextual news for manager dashboard
 * Connects to: Manager API news endpoints, Manager authentication
 * 
 * Notes: Fully self-contained with Manager-specific styling and data sources.
 *        Uses Manager API endpoints for news fetching with fallbacks.
 *        Blue theme styling to match Manager hub branding.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildManagerApiUrl } from "../utils/managerApi";

type NewsItem = { 
  id: string | number; 
  title: string; 
  date?: string; 
  scope?: string; 
  center_id?: string; 
};

const demoManagerNews: NewsItem[] = [
  { id: 1, title: "Q3 operational metrics report available", date: "2025-08-10", scope: "company" },
  { id: 2, title: "New crew scheduling protocols implemented", date: "2025-08-05", scope: "company" },
  { id: 3, title: "Manager training workshop - August 15th", date: "2025-08-01", scope: "company" },
];

export default function ManagerNewsPreview({ code, limit = 3, showUnread = true }: { code?: string; limit?: number; showUnread?: boolean }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Ask Manager backend for filtered news
        const url = buildManagerApiUrl('/news', { code, limit });
        const r = await fetch(url, { 
          credentials: 'include',
          headers: {
```
</details>
- DB refs: `"`
- TS types: `NewsItem`
- External deps: `react`, `react-router-dom`

### frontend\src\pages\Hub\Manager\components\Settings.tsx
<details><summary>First 50 lines</summary>

```tsx
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export default function Settings() {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid #222',
      borderRadius: 12,
      padding: 16
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Settings</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
        Manage your account and security preferences.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/account#security" style={{
          padding: '8px 12px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 8,
          fontSize: 13,
          textDecoration: 'none'
        }}>Change Password</a>
      </div>
    </div>
  );
}


```
</details>
- DB refs: `'`
- External deps: `react`

### backend\server\hubs\manager\routes.ts
<details><summary>First 50 lines</summary>

```ts
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';
import { z } from 'zod';
import { requirePermission } from '../../src/auth/rbac';

const router = express.Router();

function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-manager-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/manager/centers?code=MGR-001
router.get('/centers', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || getUserId(req) || '').toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    const rows = (await pool.query(
      `SELECT center_id AS id, center_name AS name FROM centers WHERE UPPER(cks_manager)=UPPER($1) ORDER BY center_name`,
      [code]
    )).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[manager] centers list error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// GET /api/manager/customers?code=MGR-001
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || getUserId(req) || '').toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    const rows = (await pool.query(
      `SELECT customer_id AS id, company_name AS name FROM customers WHERE UPPER(cks_manager)=UPPER($1) ORDER BY company_name`,
      [code]
    )).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[manager] customers list error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// GET /api/manager/profile
```
</details>
- Backend routes: `GET /centers`, `GET /customers`, `GET /profile`, `GET /news`, `GET /requests`, `POST /requests/:id/schedule`, `POST /jobs/:id/assign`, `GET /dashboard`, `GET /contractors`, `GET /ecosystem`, `GET /activity`, `GET /contractor/:contractorId`, `POST /clear-activity`
- DB refs: `'`, `orders`, `service_jobs`, `job_assignments`, `system_activity`
- External deps: `express`, `zod`

## API endpoint list

_None found_

## Database tables list

- `"`
- `'`
- `Photo`
- `job_assignments`
- `orders`
- `service_jobs`
- `system_activity`

## Type/interface list

- `EcosystemNode`
- `LogoutButtonProps`
- `ManagerSection`
- `ManagerState`
- `NewsItem`
- `NodeType`
- `for`

## External dependency list

- `@clerk/clerk-react`
- `express`
- `react`
- `react-dom`
- `react-router-dom`
- `zod`

## Shared utilities/hooks imported

- `Database\db\pool`
- `backend\server\src\auth\rbac`