/**
 * File: main.tsx
 *
 * Description:
 *   Frontend bootstrap: mounts React app, wires Clerk auth, routing, and global error overlays.
 *
 * Functionality:
 *   Sets up BrowserRouter, SignedIn/SignedOut gating (with ClerkLoaded/ClerkLoading),
 *   and default redirects so / and /home go to /login; protects app routes.
 *
 * Importance:
 *   Ensures reliable auth gating and stable app initialization without flicker/loops.
 *
 * Connections:
 *   Wraps <App/>, uses ClerkProvider with VITE_CLERK_PUBLISHABLE_KEY, imports index.css.
 *
 * Notes:
 *   Error overlay surfaces runtime exceptions even if the React tree fails early.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Clerk auth
import { ClerkProvider, ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/clerk-react';
import App from "./App";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from './pages/Login';
import Logout from './pages/Logout';
// CKS: removed DEV fetch shim & mocks (manager filming glue)

const rootEl = document.getElementById("root");
// Basic global error hooks to surface early crashes
if (typeof window !== 'undefined') {
  // Log to console and also show a visible overlay so runtime errors on the dev server
  // are visible even if the React tree fails to render (useful when debugging blank page).
  function showErrorOverlay(msg: string) {
    try {
      const id = 'global-error-overlay';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.left = '0';
        el.style.right = '0';
        el.style.top = '0';
        el.style.padding = '12px 16px';
        el.style.background = 'rgba(255,240,240,0.98)';
        el.style.color = '#700';
        el.style.zIndex = '999999';
        el.style.fontFamily = 'Inter, system-ui, Arial, sans-serif';
        el.style.fontSize = '13px';
        el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
        document.body.appendChild(el);
      }
      el.innerText = 'Runtime error: ' + msg;
    } catch (err) {
      // ignore
    }
  }

  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('Global error:', e.error || e.message || e);
    try {
      const m = (e.error && (e.error.message || e.error.toString())) || e.message || String(e);
      showErrorOverlay(m);
    } catch {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled rejection:', e.reason || e);
    try {
      const m = (e.reason && (e.reason.message || e.reason.toString())) || String(e.reason || e);
      showErrorOverlay(m);
    } catch {}
  });
}

const publishableKey = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(rootEl!).render(
  <React.StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey}>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Make login the default landing page */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/home" element={<Navigate to="/login" replace />} />
              {/* Simple, reliable auth flow: if signed out, go to /login; if signed in, show the app */}
              <Route path="/login" element={<Login />} />
              <Route path="/logout" element={<Logout />} />
              <Route
                path="/*"
                element={
                  <>
                    <ClerkLoaded>
                      <SignedIn>
                        <App />
                      </SignedIn>
                      <SignedOut>
                        <Navigate to="/login" replace />
                      </SignedOut>
                    </ClerkLoaded>
                    <ClerkLoading>
                      <div style={{ padding: 16 }}>Loading…</div>
                    </ClerkLoading>
                  </>
                }
              />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="*" element={<App />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    )}
  </React.StrictMode>
);
