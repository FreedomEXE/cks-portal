import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { AuthenticatedApp, UnauthenticatedApp } from './App';

const PUBLISHABLE_KEY = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_dummy_key_for_ui_only';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with id "root" not found');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <SignedIn>
          <AuthenticatedApp />
        </SignedIn>
        <SignedOut>
          <UnauthenticatedApp />
        </SignedOut>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
