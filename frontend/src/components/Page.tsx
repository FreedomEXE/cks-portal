/**
 * File: Page.tsx
 *
 * Description:
 *   Shared page shell with a header (title, left/right slots) and content area.
 *
 * Functionality:
 *   Renders a consistent card-style header with optional back/home buttons and a
 *   right-side UserWidget. Hides the profile pill on Admin hub pages.
 *
 * Importance:
 *   Provides consistent layout and navigation affordances across Admin and other hubs.
 *
 * Connections:
 *   Used by AdminHub and subpages; imports UserWidget; integrates with react-router.
 *
 * Notes:
 *   Username-scoped Admin routes (/:username/hub/*) suppress the UserWidget.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import UserWidget from "./UserWidget";
import { useUser } from "../lib/auth";
import getRole from "../lib/getRole";

const USE_NEW_ADMIN_UI = (import.meta.env.VITE_USE_NEW_ADMIN_UI === 'true') || (import.meta.env.USE_NEW_ADMIN_UI === 'true');

type PageProps = {
  title: ReactNode;
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
};

export default function Page({ title, children, left = null, right = null }: PageProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useUser();
  const role = getRole(user) ?? '';
  const segments = pathname.split("/").filter(Boolean);
  const isHome = pathname === "/home";
  const isHubRoot = /^\/(?:hubs\/(admin|crew|manager|contractor|customer|center)|[^/]+\/hub)$/.test(pathname);
  const isAdminSection = pathname.startsWith('/admin/');
  // Admin hub pages are username-scoped like "/:username/hub" and subpaths in the new structure.
  const isUsernameScopedHub = /^\/[^/]+\/hub(\/.*)?$/.test(pathname);
  // Hide the profile widget on Admin Hub pages and classic /admin/* sections.
  // Allow manager-role users to keep the UserWidget visible on username-scoped hubs
  // so they can access logout and other session actions while filming.
  // If the new Admin UI is disabled, keep legacy behavior: hide widget for username-scoped hubs
  const hideUserWidget = isAdminSection || isHome || (isUsernameScopedHub && (!USE_NEW_ADMIN_UI ? role !== 'manager' : role !== 'manager'));
  const showBack = !isHome && segments.length >= 2;

  const iconBtnStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 999,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const defaultLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <Link to="/hub" className="ui-button" aria-label="Home" title="Home" style={iconBtnStyle}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 21V12h6v9" />
        </svg>
      </Link>
      {showBack ? (
        <button
          className="ui-button"
          aria-label="Back"
          title="Back"
          style={iconBtnStyle}
          onClick={() => {
            if (window.history.length > 1) navigate(-1); else navigate("/hub");
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
            <line x1="9" y1="12" x2="21" y2="12" />
          </svg>
        </button>
      ) : null}
    </div>
  );

  const effectiveLeft = left ?? ((isAdminSection || isHubRoot) ? null : defaultLeft);
  const effectiveRight = right ?? (hideUserWidget ? null : <UserWidget />);
  const hasSlots = !!effectiveLeft || !!effectiveRight;
  return (
    <div style={{maxWidth: "1200px", margin: "0 auto"}}>
      {hasSlots ? (
        <div className="card" style={{display:"flex", alignItems:"center", justifyContent:"space-between", margin:"24px 0 12px", gap:12, padding:12, borderTop:'4px solid #3b7af7'}}>
          <div style={{display:"flex", alignItems:"center", gap:12, minWidth:0}}>
            {effectiveLeft}
            {/* Wrap title contents so child components can control their own font-weight */}
            <h1 style={{fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin:0}}>
              <span style={{fontWeight: 800}}>{title}</span>
            </h1>
          </div>
          {/* Make right slot flexible but capped so it never crowds the title */}
          <div style={{display:'flex', alignItems:'center', gap:8, flex: "0 1 360px", maxWidth: 360, minWidth: 180, justifyContent:'flex-end'}}>
            {effectiveRight}
            {/* Dev-only fallback: if the widget is hidden but user is manager, show a small logout for filming */}
            {hideUserWidget && role === 'manager' && import.meta.env.DEV ? (
              <button className="ui-button" onClick={() => { try { window.location.href = '/logout'; } catch{} }} title="Sign out">Log out</button>
            ) : null}
          </div>
        </div>
      ) : (
        <h1 style={{fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin:"24px 0 12px"}}>
          <span style={{fontWeight: 800}}>{title}</span>
        </h1>
      )}
      <div style={{animation:"fadeIn .12s ease-out"}}>
        {children}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}
