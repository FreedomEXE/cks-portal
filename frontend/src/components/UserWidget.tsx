import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ProfilePhoto from "./ProfilePhoto";
import useMeProfile from "../hooks/useMeProfile";
import { deriveCodeFrom, displayNameFrom } from "../utils/profileCode";
import { buildHubPath } from '../lib/hubRoutes';

// A compact identity widget for the page header (top-right).
// Shows a tiny profile card; acts as an entry point to My Profile and Login/Logout.
export default function UserWidget({ to }: { to?: string }) {
  const navigate = useNavigate();
  const { kind, data } = useMeProfile();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const roleParam = (params.get('role') || params.get('kind') || '').toLowerCase();
  const codeParam = params.get('code') || '';

  // In dev (no real auth), allow a simple signed-out flag to show a Login button
  const isDev = import.meta.env?.VITE_AUTH_ENABLED !== 'true';

  const display = useMemo(() => {
    // Prefer explicit URL params, then remembered values, then hook state
    const rememberedRole = (localStorage.getItem('me:lastRole') || '').toLowerCase();
    const rememberedCode = localStorage.getItem('me:lastCode') || '';
  let k = (rememberedRole || roleParam || kind || '').toLowerCase();
  let code = rememberedCode || codeParam || deriveCodeFrom(kind, data) || '';

    // Compose name from data when available
    let name = displayNameFrom(kind, data) || 'My Profile';
    if (k === 'contractor' && data?.company_name) name = data.company_name;
    if (k === 'customer' && data?.company_name) name = data.company_name;
    if (k === 'center' && (data?.center_name || data?.name)) name = data.center_name || data.name;

    const subtitle = [k && k.charAt(0).toUpperCase() + k.slice(1), code].filter(Boolean).join(' • ');
    return { k, name, code, subtitle };
  }, [roleParam, codeParam, kind, data]);

  useEffect(() => {
    // Persist last non-admin selection for consistent routing
    if (display.k && display.k !== 'admin' && display.code) {
      try {
        localStorage.setItem('me:lastRole', display.k);
        localStorage.setItem('me:lastCode', display.code);
      } catch {}
    }
  }, [display.k, display.code]);

  const cardStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    padding: '6px 10px',
    background: '#fff',
    boxShadow: '0 0 0 rgba(0,0,0,0)',
    transition: 'box-shadow .18s ease, transform .18s ease',
  };

  const textWrap: React.CSSProperties = { minWidth: 0 };
  const titleStyle: React.CSSProperties = { fontWeight: 700, lineHeight: 1.1, margin: 0, fontSize: 14 };
  const subStyle: React.CSSProperties = { color: '#6b7280', margin: 0, fontSize: 12 };

  const onSignOut = () => {
    // Use unified logout route which calls Clerk signOut (when enabled) and then redirects to /login
    window.location.href = '/logout';
  };

  const profileTo = to || 
    (display.k && display.code
      ? buildHubPath(display.k, `profile?role=${encodeURIComponent(display.k)}&code=${encodeURIComponent(display.code)}`)
      : "/me/profile");

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link to={profileTo} className="ui-card" style={cardStyle} aria-label="My Profile">
        <ProfilePhoto id={`${display.k || 'user'}:${display.code || 'me'}`} name={display.name} size={32} editable={false} />
        <div style={textWrap}>
          <div className="title" style={titleStyle}>{display.name}</div>
          {display.subtitle ? <div style={subStyle}>{display.subtitle}</div> : null}
        </div>
      </Link>
      <button className="ui-button" onClick={onSignOut} aria-label="Sign out" title="Sign out">
        Log out
      </button>
    </div>
  );
}
