/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * HubRoleRouter.tsx (Role-Based Hub Router)
 * 
 * Description: Routes users to their specific hub based on role
 * Function: Determines user role and loads appropriate hub component
 * Importance: Critical - Controls role-based access and navigation
 * Connects to: All hub components, Clerk auth, role detection
 * 
 * Notes: ALL HUBS ARE NOW FULLY INDEPENDENT - each handles its own routes,
 *        profile pages, and feature placeholders. No shared routing needed.
 */

import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useParams } from 'react-router-dom';
// Inline role extraction utility
function getRole(user: any, headers?: Record<string, string | null | undefined>) {
  // Dev override only when impersonation flag is set
  try {
    const ss = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    const isImp = ss?.getItem('impersonate') === 'true';
    if (isImp) {
      const ssRole = ss?.getItem('me:lastRole') || ss?.getItem('manager:lastRole');
      if (ssRole) return ssRole.toLowerCase();
    }
  } catch { /* ignore */ }
  // First check for template users (prefix-000 format) - infer role from username
  const username = user?.username || '';
  if (/^[a-z]{2,3}-\d{3}$/i.test(username)) {
    const rawPrefix = username.split('-')[0]?.toLowerCase();
    switch(rawPrefix) {
      case 'mgr': return 'manager';
      case 'cus': return 'customer';
      case 'cen': return 'center';
      case 'ctr': return 'center'; // Legacy support for ctr-000
      case 'con': return 'contractor';
      case 'crw': return 'crew';
      case 'adm': return 'admin';
      case 'wh':  return 'warehouse';
      default: return null;
    }
  }
  
  // Then check metadata for real users
  const raw = (user as any)?.publicMetadata?.role ?? (user as any)?.role ?? undefined;
  if (raw && typeof raw === 'string') return raw.toLowerCase();
  
  // Allow header fallback (x-user-role)
  const hdr = (headers?.['x-user-role'] ?? headers?.['X-User-Role']) as string | undefined;
  if (hdr) return String(hdr).toLowerCase();
  return null;
}

// Hub imports - all hubs are now fully independent
import AdminHub from './Hub/Admin';
import ManagerHub from './Hub/Manager';
import CenterHub from './Hub/Center';
import ContractorHub from './Hub/Contractor';
import WarehouseHub from './Hub/Warehouse';
import CrewHub from './Hub/Crew';
import CustomerHub from './Hub/Customer';

export default function HubRoleRouter() {
  const { user } = useUser();
  const role = (getRole(user) || '').toLowerCase();
  const { username = '' } = useParams();

  /**
   * ALL HUBS ARE NOW FULLY INDEPENDENT - Just pass ALL routes to them
   * Each hub handles its own routing, profile pages, and feature placeholders
   */
  switch(role) {
    case 'manager':
      return <ManagerHub />;
    case 'customer':
      return <CustomerHub />;
    case 'center':
      return <CenterHub />;
    case 'contractor':
      return <ContractorHub />;
    case 'crew':
      return <CrewHub />;
    case 'admin':
      return <AdminHub />;
    case 'warehouse':
      return <WarehouseHub />;
    default:
      return <AdminHub />; // Fallback to admin hub
  }
}
