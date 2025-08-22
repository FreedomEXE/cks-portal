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
 * Notes: Manager Hub is now FULLY INDEPENDENT - it handles ALL its own routes.
 *        Other hubs will follow this pattern as we refactor them.
 */

import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import getRole from '../lib/getRole';

// Hub imports - correct paths from pages level
import AdminHub from './Hub/Admin/AdminHub';
import ManagerHub from './Hub/Manager';
import CenterHub from './Hub/Center';
import ContractorHub from './Hub/Contractor';
import CrewHub from './Hub/Crew';
import CustomerHub from './Hub/Customer';

// Shared pages (only for non-independent hubs)
import MyProfile from './MyProfile';
import Page from '../components/Page';

// Feature flags for gradual rollout
const USE_NEW_CENTER_HUB = import.meta.env.VITE_USE_NEW_CENTER_HUB === 'true' || true;
const USE_NEW_CONTRACTOR_HUB = import.meta.env.VITE_USE_NEW_CONTRACTOR_HUB === 'true' || true;
const USE_NEW_CREW_HUB = import.meta.env.VITE_USE_NEW_CREW_HUB === 'true' || true;
const USE_NEW_CUSTOMER_HUB = import.meta.env.VITE_USE_NEW_CUSTOMER_HUB === 'true' || true;

/**
 * Placeholder component for features not yet implemented
 */
const Placeholder = ({ title }: { title: string }) => (
  <Page title={title}>
    <div className="ui-card" style={{ padding: 16 }}>
      Section "{title}" coming soon.
    </div>
  </Page>
);

export default function HubRoleRouter() {
  const { user } = useUser();
  const role = (getRole(user) || '').toLowerCase();
  const { username = '' } = useParams();

  /**
   * MANAGER HUB IS FULLY INDEPENDENT - Just pass ALL routes to it
   */
  if (role === 'manager') {
    return <ManagerHub />;
  }

  /**
   * For other hubs, use the old routing system (for now)
   */
  function getLandingComponent() {
    switch(role) {
      case 'admin':
        return <AdminHub />;
      case 'center':
        return USE_NEW_CENTER_HUB ? <CenterHub /> : <AdminHub />;
      case 'contractor':
        return USE_NEW_CONTRACTOR_HUB ? <ContractorHub /> : <AdminHub />;
      case 'crew':
        return USE_NEW_CREW_HUB ? <CrewHub /> : <AdminHub />;
      case 'customer':
        return USE_NEW_CUSTOMER_HUB ? <CustomerHub /> : <AdminHub />;
      default:
        return <AdminHub />; // Fallback
    }
  }

  return (
    <Routes>
      {/* Hub landing page */}
      <Route path="" element={getLandingComponent()} />
      
      {/* Shared profile route - ONLY for non-independent hubs */}
      <Route path="profile" element={<MyProfile />} />
      
      {/* Shared placeholder routes */}
      <Route path="centers" element={<Placeholder title="Centers" />} />
      <Route path="services" element={<Placeholder title="Services" />} />
      <Route path="jobs" element={<Placeholder title="Jobs" />} />
      <Route path="contractors" element={<Placeholder title="Contractors" />} />
      <Route path="crew" element={<Placeholder title="Crew" />} />
      <Route path="documents" element={<Placeholder title="Documents" />} />
      <Route path="support" element={<Placeholder title="Support" />} />
      <Route path="reports" element={<Placeholder title="Reports" />} />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}