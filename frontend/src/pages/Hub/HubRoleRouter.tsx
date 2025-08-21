import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import getRole from '../../lib/getRole';
import AdminHub from './Admin/AdminHub';
import DirectoryPage from './Admin/Directory/DirectoryPage';
// Added shared admin pages (legacy top-level) routed under hub
import CreatePage from '../../pages/Create';
import CreateItem from '../../pages/CreateItem';
import ManagePage from '../../pages/Manage';
import ManageList from '../../pages/ManageList';
import AssignPage from '../../pages/Assign';
import OrdersPage from '../../pages/Orders';
import NewsPage from '../../pages/News';
import ReportsPage from '../../pages/Reports';
// Using unified MyProfile page (no separate Hub/MyProfile variant present on disk)
import MyProfile from '../../pages/MyProfile';
import ManagerHub from './Manager/ManagerHub';
import CenterHub from './Center';
import ContractorHub from './Contractor';
import CrewHub from './Crew';
import CustomerHub from './Customer';
import Page from '../../components/Page';
// Role-specific profile components
import CenterProfile from './Center/Profile';
import CrewProfile from './Crew/Profile';
import CustomerProfile from './Customer/Profile';
import ManagerProfile from './Manager/Profile/ManagerProfile';

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
  const { username = '' } = useParams();

  // Choose base hub landing component by role
  function landing() {
    if (role === 'manager') return <ManagerHub />;
    if (role === 'admin') return <AdminHub />;
    if (role === 'center') return USE_NEW_CENTER_HUB ? <CenterHub /> : <AdminHub />;
    if (role === 'contractor') return USE_NEW_CONTRACTOR_HUB ? <ContractorHub /> : <AdminHub />;
    if (role === 'crew') return USE_NEW_CREW_HUB ? <CrewHub /> : <AdminHub />;
    if (role === 'customer') return USE_NEW_CUSTOMER_HUB ? <CustomerHub /> : <AdminHub />;
    return <AdminHub />; // fallback
  }

  // profileBody helper was deprecated after routing consolidated to MyProfile

  // Wrapper page for sub-sections that are not yet implemented in new hubs
  const Placeholder = ({ title }: { title: string }) => (
    <Page title={title}><div className="ui-card" style={{ padding: 16 }}>Section "{title}" coming soon.</div></Page>
  );

  return (
    <Routes>
      {/* Root hub landing */}
      <Route path="" element={landing()} />
      {/* Sub-routes */}
      <Route path="profile" element={<MyProfile />} />
  <Route path="centers" element={<Placeholder title="Centers" />} />
  <Route path="services" element={<Placeholder title="Services" />} />
  <Route path="jobs" element={<Placeholder title="Jobs" />} />
  {/* Admin Hub Routes */}
  <Route path="directory" element={<DirectoryPage />} />
  <Route path="directory/:section" element={<DirectoryPage />} />
  <Route path="create" element={<CreatePage />} />
  <Route path="create/:type" element={<CreateItem />} />
  <Route path="manage" element={<ManagePage />} />
  <Route path="manage/:type" element={<ManageList />} />
  <Route path="assign" element={<AssignPage />} />
  <Route path="orders" element={<OrdersPage />} />
  <Route path="news" element={<NewsPage />} />
  <Route path="reports" element={<ReportsPage />} />
      {/* Unknown sub-route -> hub root */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
