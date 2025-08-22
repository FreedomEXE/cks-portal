/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * main.tsx (Application Entry Point)
 * 
 * Description: Root entry point that mounts the React application
 * Function: Initializes React, Router, Clerk auth, and renders to DOM
 * Importance: Critical - Without this, nothing renders
 * Connects to: App.tsx, index.html, Clerk provider
 * 
 * Notes: This is standard Vite + React setup.
 *        DO NOT DELETE - Required for app to run.
 *        Clerk wraps everything for authentication.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

// Clerk publishable key from environment
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);