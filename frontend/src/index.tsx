/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Application Root & Router - FULLY CONSOLIDATED)
 * 
 * Description: Complete application entry point combining React root, providers, and routing
 * Function: Initializes React app, configures authentication, and handles all application routing
 * Importance: Critical - Core application foundation that mounts everything to DOM
 * Connects to: DOM root, Clerk authentication, all hub components, login system
 * 
 * Notes: Consolidates main.tsx + App.tsx + AfterSignIn.tsx into single file.
 *        Provides complete app initialization with Clerk auth wrapper.
 *        Handles all routing logic including auth redirects and hub access.
 *        Uses hub-independent routing - each hub manages internal navigation.
 *        Eliminates unnecessary component nesting and reduces bundle size.
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, Route, Navigate, BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider, useUser } from '@clerk/clerk-react';
import HubRoleRouter from './pages/HubRoleRouter';
import Login from './pages/Login';
import './index.css';

// Clerk publishable key from environment
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment');
}

// Consolidated AfterSignIn redirect component
function AfterSignInRedirect() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  useEffect(() => {
    if (!user) return;
    const username = (
      user.username || 
      user.primaryEmailAddress?.emailAddress?.split("@")[0] || 
      "me"
    ).toLowerCase();
    navigate(`/${username}/hub`, { replace: true });
  }, [user, navigate]);
  
  return (
    <div style={{ 
      padding: 24, 
      textAlign: 'center', 
      color: '#6b7280',
      fontFamily: 'Inter, system-ui, Arial, sans-serif' 
    }}>
      Redirecting to your hub...
    </div>
  );
}

// Main application component with consolidated routing
function App() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
      <div style={{ padding: '8px 16px 40px' }}>
        <Routes>
          {/* Public routes redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Navigate to="/login" replace />} />
          
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/redirect" element={<AfterSignInRedirect />} />
          
          {/* Hub system - all authenticated routes */}
          <Route path=":username/hub/*" element={<HubRoleRouter />} />
          
          {/* Fallback for any unmatched routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// Application root with all providers and initialization
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);