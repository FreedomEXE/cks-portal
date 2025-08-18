import React from 'react';
import { useUser } from '@clerk/clerk-react';

import AdminHub from './Admin/AdminHub';
import ManagerHubRoutes from './Manager/HubRoutes';            // New manager implementation
import LegacyManagerHub from '../Hubs/Manager/ManagerHub';     // Legacy “MyHub” implementation
import getRole from '../../lib/getRole';

// Feature flags (support raw + Vite-prefixed for flexibility)
const USE_NEW_ADMIN_UI =
  (import.meta.env.USE_NEW_ADMIN_UI === 'true') ||
  (import.meta.env.VITE_USE_NEW_ADMIN_UI === 'true');

const USE_NEW_MANAGER_HUB =
  (import.meta.env.USE_NEW_MANAGER_HUB === 'true') ||
  (import.meta.env.VITE_USE_NEW_MANAGER_HUB === 'true');

export default function HubRoleRouter() {
  const { user } = useUser();
  const role = (getRole(user) || '').toLowerCase();

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[HubRoleRouter debug]', {
      rawRole: getRole(user),
      normalized: role,
      USE_NEW_ADMIN_UI,
      USE_NEW_MANAGER_HUB,
      chosen: role === 'manager'
        ? (USE_NEW_MANAGER_HUB ? 'NEW ManagerHubRoutes' : 'LEGACY ManagerHub')
        : 'AdminHub (fallback)'
    });
  }

  // Manager branch first so admin UI flag doesn’t suppress manager testing
  if (role === 'manager') {
    return USE_NEW_MANAGER_HUB ? <ManagerHubRoutes /> : <LegacyManagerHub />;
  }

  // (Optional) If you really want to force legacy Admin UI override for all non-managers when disabled:
  // if (!USE_NEW_ADMIN_UI) return <AdminHub />;

  // Default / Admin
  return <AdminHub />;
}