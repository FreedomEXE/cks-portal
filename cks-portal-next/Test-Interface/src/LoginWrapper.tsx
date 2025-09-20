import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import Login from '../../Auth/src/pages/Login';

// Use env publishable key if provided; fall back to a harmless test string for UI-only rendering
const PUBLISHABLE_KEY = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_ui_only';

// Thin wrapper to provide Router + Clerk context so the Login page can render inside the Test Interface
export default function LoginWrapper(_: Record<string, unknown>) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </ClerkProvider>
  );
}
