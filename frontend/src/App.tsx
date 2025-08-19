/**
 * File: App.tsx
 *
 * Description:
 *   Application router for CKS Portal.
 *
 * Functionality:
 *   Defines all route-level pages, including username-scoped Admin hub routes (/ :username/hub/*)
 *   and legacy redirects. Also normalizes /hub to the user’s hub using sessionStorage.
 *
 * Importance:
 *   Central routing map; keeps Admin hub self-contained while preserving back-compat paths.
 *
 * Connections:
 *   Imports Admin hub pages, shared pages/components, and uses react-router-dom.
 *
 * Notes:
 *   Avoids inline dynamic imports to keep parsing stable; redirects root/home to /login.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

// Test routes are lazily loaded and gated by an env flag below
/**
 * App.tsx
 *
 * Main application entry point for the CKS Portal frontend.
 * Sets up global layout, navigation, and all route-level page components for the admin and test views.
 * Handles routing for all admin directory pages, test pages, and fallback routes.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import Page from "./components/Page";

// Admin hub (reorganized)
import AdminHub from './pages/Hub/Admin/AdminHub';
import HubRoleRouter from './pages/Hub/HubRoleRouter';
import DirectoryPage from './pages/Hub/Admin/Directory/DirectoryPage';
import AdminCreate from './pages/Hub/Admin/Create/CreatePage';
import AdminManage from './pages/Hub/Admin/Manage/ManagePage';
import AdminAssign from './pages/Hub/Admin/Assign/AssignPage';
import AdminReports from './pages/Hub/Admin/Reports/ReportsPage';
import AdminOrders from './pages/Hub/Admin/Orders/OrdersPage';
import AdminNews from './pages/Hub/Admin/News/NewsPage';
import CreateCrew from './pages/Hub/Admin/Create/CreateCrew';
import CreateManager from './pages/Hub/Admin/Create/CreateManager';
import CreateContractor from './pages/Hub/Admin/Create/CreateContractor';
import CreateCustomer from './pages/Hub/Admin/Create/CreateCustomer';
import CreateCenter from './pages/Hub/Admin/Create/CreateCenter';
import CreateService from './pages/Hub/Admin/Create/CreateService';
import CreateJob from './pages/Hub/Admin/Create/CreateJob';
import CreateSupply from './pages/Hub/Admin/Create/CreateSupply';
import CreateProcedure from './pages/Hub/Admin/Create/CreateProcedure';
import CreateTraining from './pages/Hub/Admin/Create/CreateTraining';
import CreateWarehouse from './pages/Hub/Admin/Create/CreateWarehouse';

// consolidated directory uses AdminDirectoryIndex for all sections
import { useLocation } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import MePage from './pages/MePage';
import MyProfilePage from './pages/MyProfile';
import ManagerProfilePage from './pages/Hubs/Manager/ManagerProfilePage';
import ManagerProfileParitySmoke from './pages/Hubs/Manager/ManagerProfileParitySmoke';
import getRole from './lib/getRole';
// RoleProfile/ProfileRoute removed after inlining My Profile into hubs
import HubRouter from './pages/HubRouter';
// Old import kept above for back-compat, but new AdminHub path is used.
import CenterHub from './pages/Hubs/Center/CenterHub';
import ContractorHub from './pages/Hubs/Contractor/ContractorHub';
import CrewHub from './pages/Hubs/Crew/CrewHub';
import CustomerHub from './pages/Hubs/Customer/CustomerHub';
// Manager legacy hub import removed; manager goes through HubRoleRouter
import UserHub from './pages/UserHub';
import LinkAccount from './pages/LinkAccount';
import DebugMe from './pages/DebugMe';
import ClearImpersonation from './pages/ClearImpersonation';
import CreatePage from './pages/Create';
import CreateItem from './pages/CreateItem';
import ManagePage from './pages/Manage';
import ManageList from './pages/ManageList';
import ReportsPage from './pages/Reports';
import OrdersPage from './pages/Orders';
import AssignPage from './pages/Assign';
import NewsPage from './pages/News';
import MyCentersPage from './pages/MyCenters';
import MyTrainingProceduresPage from './pages/MyTrainingProcedures';
import MyServicesPage from './pages/MyServices';
import MyJobsPage from './pages/MyJobs';
import MyReportsPage from './pages/MyReports';
import SupportPage from './pages/Support';
import DocumentsPage from './pages/Documents';
import NewRequestPage from './pages/NewRequest';
import AdminUsers from './pages/AdminUsers';
// Home page retired; redirect to /hub instead

// Test/demo routes removed for now to simplify the app shell.
import AfterSignIn from './pages/Auth/AfterSignIn';
// Legacy path bridge removed; single-entry hub routing only

export default function App() {
  // Determine manager-specific profile page at render time (lightweight; relies on Clerk context if present)
  let profileElement: React.ReactElement = <MyProfilePage />;
  try {
    // Dynamic access to user via Clerk hook inside a tiny inline component to avoid hook misuse here would be overkill.
    // Instead we keep the generic element; HubRoleRouter / MyProfilePage still handle most logic.
    // ManagerProfilePage itself will stub if manager-specific data unavailable.
    // We cannot call useUser() at this level (outside component body) so selection remains static; route-level component can decide.
    // For now, always use MyProfilePage; ManagerProfilePage will be selected by replacing the element if manager role is known downstream.
  } catch {}
  return (
  <div style={{fontFamily:"Inter, system-ui, Arial, sans-serif"}}>
      <div style={{padding:"8px 16px 40px"}}>
        <Routes>
          {/* Root and /home are redirected to /login in main.tsx; keep no-op entries here to avoid conflicting redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Navigate to="/login" replace />} />
          {/* Reserve /login for the custom Clerk sign-in page (served outside this SPA) */}
          <Route path="/me" element={<MePage />} />
          <Route path="/debug/me" element={<DebugMe />} />
          {/* legacy /me/profile removed; use /:username/hub/profile */}
          {/* CKS: Clerk after-sign-in redirect to username-scoped hub */}
          <Route path="/auth/redirect" element={<AfterSignIn />} />
          {/* In-hub profile page (preferred URL) */}
          <Route path="/hubs/:role/profile" element={<MyProfilePage />} />
          <Route path="/hubs/manager/profile" element={<ManagerProfilePage />} />
          <Route path="/hubs/manager/parity-smoke" element={<ManagerProfileParitySmoke />} />
          <Route path="/:username/hub/profile" element={profileElement} />
          {/* Redirect generic /hub to username-scoped hub if we have a stored identity */}
          <Route path="/hub" element={<Navigate to={(function(){
            try {
              const code = (sessionStorage.getItem('code')||'').toLowerCase();
              const role = (sessionStorage.getItem('role')||'').toLowerCase();
              const id = code || role;
              if (id) return `/${id}/hub`;
            } catch {}
            return '/login';
          })()} replace />} />
          {/* Top-level username-scoped hub routed by role */}
          <Route path="/:username/hub/*" element={<HubRoleRouter />} />
          <Route path="/:username/hub/directory" element={<DirectoryPage />} />
          <Route path="/:username/hub/directory/:section" element={<DirectoryPage />} />
          <Route path="/:username/hub/create" element={<AdminCreate />} />
          <Route path="/:username/hub/create/newcrew" element={<CreateCrew />} />
          <Route path="/:username/hub/create/newmanager" element={<CreateManager />} />
          <Route path="/:username/hub/create/newcontractor" element={<CreateContractor />} />
          <Route path="/:username/hub/create/newcustomer" element={<CreateCustomer />} />
          <Route path="/:username/hub/create/newcenter" element={<CreateCenter />} />
          <Route path="/:username/hub/create/newservice" element={<CreateService />} />
          <Route path="/:username/hub/create/newjob" element={<CreateJob />} />
          <Route path="/:username/hub/create/newsupply" element={<CreateSupply />} />
          <Route path="/:username/hub/create/newprocedure" element={<CreateProcedure />} />
          <Route path="/:username/hub/create/newtraining" element={<CreateTraining />} />
          <Route path="/:username/hub/create/newwarehouse" element={<CreateWarehouse />} />
          {/* The following subcreate routes navigate to dedicated components if used later */}
          <Route path="/:username/hub/manage" element={<AdminManage />} />
          <Route path="/:username/hub/assign" element={<AdminAssign />} />
          <Route path="/:username/hub/reports" element={<AdminReports />} />
          <Route path="/:username/hub/orders" element={<AdminOrders />} />
          <Route path="/:username/hub/news" element={<AdminNews />} />
          <Route path="/link" element={<LinkAccount />} />
          <Route path="/hubs/:slug" element={<UserHub />} />
          {/* Back-compat: tolerate URLs missing the '/hub' segment, e.g. '/:username/directory' -> '/:username/hub/directory' */}
          <Route path="/:username/:section" element={<Navigate to={(function(){
          {/** CKS: DEV-only override wrapper for filming legacy Manager hub with ?code=MGR-... */}
            try {
              const parts = window.location.pathname.split('/');
              if (parts.length >= 3) {
                const u = parts[1];
                const s = parts[2];
                return `/${u}/hub/${s}`;
              }
            } catch {}
            return window.location.pathname;
          })()} replace />} />
          <Route path="/:username/:section/:sub" element={<Navigate to={(function(){
            try {
              const parts = window.location.pathname.split('/');
              if (parts.length >= 4) {
                const u = parts[1];
                const s = parts[2];
                const sub = parts.slice(3).join('/');
                return `/${u}/hub/${s}/${sub}`;
              }
            } catch {}
            return window.location.pathname;
          })()} replace />} />
          <Route path="/hubs/:slug/directory/:section" element={<DirectoryPage />} />
          {/* Normalize hubId to lowercase: if someone visits /hubs/Foo/... redirect to /hubs/foo/... */}
          <Route path="/hubs/:hubId/*" element={<Navigate to={(function(){
            try {
              const parts = window.location.pathname.split('/');
              // parts: ["", "hubs", "hubId", ...rest]
              if (parts.length >= 3) {
                const hub = parts[2];
                const rest = parts.slice(3).join('/');
                const lower = hub.toLowerCase();
                if (hub !== lower) return `/${lower}/hub/${rest}`;
              }
            } catch {}
            return window.location.pathname;
          })()} replace />} />
          <Route path="/hubs/admin" element={<Navigate to={(function(){
            try {
              const code = (sessionStorage.getItem('code')||'');
              const r = code || (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/${r}/hub`;
            } catch {}
            return '/freedom_exe/hub';
          })()} replace />} />
          {/* Hub-scoped pages by hubId (user-friendly id or internal_code) */}
          <Route path="/hubs/:hubId/admin" element={<AdminHub />} />
          <Route path="/hubs/:hubId/reports" element={<ReportsPage />} />
          <Route path="/hubs/:hubId/orders" element={<OrdersPage />} />
          <Route path="/clear-impersonation" element={<ClearImpersonation />} />
          {/* Role-scoped create routes */}
          <Route path="/hubs/:role/create" element={<CreatePage />} />
          <Route path="/hubs/:role/create/:type" element={<CreateItem />} />
          {/* Back-compat: redirect generic /create to the user’s hub-scoped create */}
          <Route path="/create" element={<Navigate to={(function(){
            try {
              const r = (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/${r}/hub/create`;
            } catch {}
            return '/hub';
          })()} replace />} />
          <Route path="/create/:type" element={<Navigate to={(function(){
            try {
              const r = (sessionStorage.getItem('role')||'').toLowerCase();
              const parts = window.location.pathname.split('/');
              const t = parts[parts.length - 1];
              if (r && t) return `/${r}/hub/create/${t}`;
            } catch {}
            return '/hub';
          })()} replace />} />
          {/* Role-scoped manage routes */}
          <Route path="/hubs/:role/manage" element={<ManagePage />} />
          <Route path="/hubs/:role/manage/:type" element={<ManageList />} />
          {/* Back-compat: redirect generic /manage to the user’s hub-scoped manage */}
          <Route path="/manage" element={<Navigate to={(function(){
            try {
              const r = (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/${r}/hub/manage`;
            } catch {}
            return '/hub';
          })()} replace />} />
          <Route path="/reports" element={<Navigate to={(function(){
            try {
              const code = (sessionStorage.getItem('code')||'');
              const r = code || (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/${r}/hub/reports`;
            } catch {}
            return '/reports';
          })()} replace />} />

          <Route path="/orders" element={<Navigate to={(function(){
            try {
              const code = (sessionStorage.getItem('code')||'');
              const r = code || (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/${r}/hub/orders`;
            } catch {}
            return '/orders';
          })()} replace />} />
          {/* Role-scoped assign routes */}
          <Route path="/hubs/:role/assign" element={<AssignPage />} />
          {/* Back-compat: redirect generic /assign to the user’s hub-scoped assign */}
          <Route path="/assign" element={<Navigate to={(function(){
            try {
              const r = (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/${r}/hub/assign`;
            } catch {}
            return '/hub';
          })()} replace />} />
          {/* Back-compat: redirect generic /assign/:type to hub-scoped manage list */}
          <Route path="/assign/:type" element={<Navigate to={(function(){
            try {
              const r = (sessionStorage.getItem('role')||'').toLowerCase();
              const parts = window.location.pathname.split('/');
              const t = parts[parts.length - 1];
              if (r && t) return `/${r}/hub/manage/${t}`;
            } catch {}
            return '/hub';
          })()} replace />} />
          {/* Redirect /hubs/:role/assign/:type to /hubs/:role/manage/:type for now */}
          <Route path="/hubs/:role/assign/:type" element={<Navigate to={(function(){
            try {
              const parts = window.location.pathname.split('/');
              const r = parts[2];
              const t = parts[4];
              if (r && t) return `/hubs/${r}/manage/${t}`;
            } catch {}
            return '/hub';
          })()} replace />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/new-request" element={<NewRequestPage />} />
          {/* Back-compat: redirect generic /manage/:type to hub-scoped */}
          <Route path="/manage/:type" element={<Navigate to={(function(){
            try {
              const r = (sessionStorage.getItem('role')||'').toLowerCase();
              const t = window.location.pathname.split('/').pop();
              if (r && t) return `/hubs/${r}/manage/${t}`;
            } catch {}
            return '/hub';
          })()} replace />} />
          <Route path="/admin" element={<Navigate to={(function(){
            try {
              const code = (sessionStorage.getItem('code')||'');
              const r = code || (sessionStorage.getItem('role')||'').toLowerCase();
              if (r) return `/hubs/${r}/admin`;
            } catch {}
            return '/admin';
          })()} replace />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/:section" element={<DirectoryPage />} />
          <Route path="/hubs/center" element={<CenterHub />} />
          <Route path="/hubs/contractor" element={<ContractorHub />} />
          <Route path="/hubs/crew" element={<CrewHub />} />
          <Route path="/hubs/customer" element={<CustomerHub />} />
          {/* Legacy Manager hub removed; manager role now routed by HubRoleRouter */}

          {/* /test/* routes removed */}
            <Route path="*" element={<Page title="Not found"><div>Route not found.</div></Page>} />
        </Routes>
      </div>
    </div>
  );
}

// RoleProfile component renders the correct tabbed template based on useMeProfile
