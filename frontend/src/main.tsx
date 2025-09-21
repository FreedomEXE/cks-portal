import '@cks-ui/styles/globals.css';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthenticatedApp, UnauthenticatedApp } from './App';
import './index.css';

// Read the Clerk publishable key from Vite env. Do not hardcode or fall back to a dummy key.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Define it in frontend/.env or .env.local and restart the dev server.');
}

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
