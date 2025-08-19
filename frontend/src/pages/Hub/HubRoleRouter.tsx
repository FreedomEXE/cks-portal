import React from 'react';
import { useUser } from '@clerk/clerk-react';

import AdminHub from './Admin/AdminHub';
import ManagerHub from './Manager/ManagerHub';                 // Simple manager hub
import getRole from '../../lib/getRole';
import CenterHub from './Center/CenterHub';
import ContractorHub from './Contractor/ContractorHub';
import CrewHub from './Crew/CrewHub';
import CustomerHub from './Customer/CustomerHub';

// Feature flags (support raw + Vite-prefixed for flexibility)
const USE_NEW_ADMIN_UI =
  (import.meta.env.USE_NEW_ADMIN_UI === 'true') ||
  (import.meta.env.VITE_USE_NEW_ADMIN_UI === 'true');


// Feature flags for other roles (easy rollback if needed)
const USE_NEW_CENTER_HUB =
  (import.meta.env.USE_NEW_CENTER_HUB === 'true') ||
  (import.meta.env.VITE_USE_NEW_CENTER_HUB === 'true') || true; // default on
const USE_NEW_CONTRACTOR_HUB =
  (import.meta.env.USE_NEW_CONTRACTOR_HUB === 'true') ||
  (import.meta.env.VITE_USE_NEW_CONTRACTOR_HUB === 'true') || true;
const USE_NEW_CREW_HUB =
  (import.meta.env.USE_NEW_CREW_HUB === 'true') ||
  (import.meta.env.VITE_USE_NEW_CREW_HUB === 'true') || true;
const USE_NEW_CUSTOMER_HUB =
  (import.meta.env.USE_NEW_CUSTOMER_HUB === 'true') ||
  (import.meta.env.VITE_USE_NEW_CUSTOMER_HUB === 'true') || true;

export default function HubRoleRouter() {
  const { user } = useUser();
  const role = (getRole(user) || '').toLowerCase();

  if (typeof window !== 'undefined') {
    try {
      // eslint-disable-next-line no-console
      console.log('[HubRoleRouter debug]', {
        rawRole: getRole(user),
        normalized: role,
        USE_NEW_ADMIN_UI,
        USE_NEW_CENTER_HUB,
        USE_NEW_CONTRACTOR_HUB,
        USE_NEW_CREW_HUB,
        USE_NEW_CUSTOMER_HUB,
        chosen: role || 'none'
      });
    } catch {}
  }

  // Role routing (manager first to preserve legacy toggle semantics)
  if (role === 'manager') return <ManagerHub />;
  if (role === 'admin') return <AdminHub />;
  if (role === 'center') return USE_NEW_CENTER_HUB ? <CenterHub /> : <AdminHub />;
  if (role === 'contractor') return USE_NEW_CONTRACTOR_HUB ? <ContractorHub /> : <AdminHub />;
  if (role === 'crew') return USE_NEW_CREW_HUB ? <CrewHub /> : <AdminHub />;
  if (role === 'customer') return USE_NEW_CUSTOMER_HUB ? <CustomerHub /> : <AdminHub />;

  // Unknown role fallback
  return <AdminHub />;
}
