import '@cks/ui/styles/globals.css';
import '@cks/ui/assets/ui.css';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { SWRConfig } from 'swr';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthenticatedApp, UnauthenticatedApp } from './App';
import { LoadingProvider } from './contexts/LoadingContext';
import GlobalLoader from './components/GlobalLoader';
import { CartProvider } from './contexts/CartContext';
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
      <SWRConfig
        value={{
          provider: () => new Map(),
          onErrorRetry: (err, _key, config, revalidate, opts) => {
            const status = (err as any)?.status;
            if (status === 401 || status === 403) return;
            if ((opts.retryCount ?? 0) >= 2) return;
            const delay = Math.min(5000, 1000 * Math.pow(2, opts.retryCount ?? 0));
            setTimeout(() => revalidate({ retryCount: (opts.retryCount ?? 0) + 1 }), delay);
          },
        }}
      >
        <LoadingProvider>
          <CartProvider>
            <BrowserRouter>
              <SignedIn>
                <AuthenticatedApp />
              </SignedIn>
              <SignedOut>
                <UnauthenticatedApp />
              </SignedOut>
            </BrowserRouter>
            <GlobalLoader />
          </CartProvider>
        </LoadingProvider>
      </SWRConfig>
    </ClerkProvider>
  </React.StrictMode>
);
